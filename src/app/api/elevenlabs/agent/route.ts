import { NextRequest, NextResponse } from "next/server";

/**
 * API Route for ElevenLabs Agent Webhook
 * 
 * This endpoint is designed to be called by ElevenLabs agents.
 * It accepts user input (address) and returns information about the nearest pantry.
 * 
 * Expected request format from ElevenLabs:
 * {
 *   "message": "user's address or message",
 *   "conversation_id": "optional conversation id"
 * }
 * 
 * Returns:
 * {
 *   "response": "text response for the agent to speak"
 * }
 */

// Helper function to fetch pantries from Convex via HTTP action
async function fetchPantries() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
  }

  // Call the HTTP action we created in Convex
  // Convex HTTP actions are accessed via /api/actions/[module]:[function]
  const response = await fetch(`${convexUrl}/api/actions/pantries:listHttp`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch pantries: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

// Extract address from user message
// Since users will speak naturally, we accept the full message as the address
// Google's geocoding API is good at handling natural language addresses
// If default_location is provided as query param, it will be appended if address is incomplete
function extractAddress(message: string, defaultLocation?: string): string | null {
  const trimmed = message.trim();
  
  // Remove common conversational phrases that might precede the address
  const cleaned = trimmed
    .replace(/^(my address is|i live at|i'm at|i'm located at|address:|location:|it's|it is)/i, "")
    .trim();
  
  // Accept any address that's at least 3 characters (very permissive)
  if (cleaned.length < 3) {
    return null;
  }

  // If default location is provided and address looks incomplete, append it
  if (defaultLocation) {
    const defaultCity = defaultLocation.split(",")[0].trim().toLowerCase();
    const defaultState = defaultLocation.split(",")[1]?.trim().toLowerCase() || "";
    
    // Check if the address already contains city/state information
    // Be more lenient - check for city name, state abbreviation, or ZIP codes
    const cityStatePattern = new RegExp(
      `(${defaultCity}|new york|ny|132\\d{2}|onondaga|${defaultState})`,
      "i"
    );
    const hasCityState = cityStatePattern.test(cleaned);
    
    // If it's just a street address (starts with numbers but no city/state), append default location
    if (!hasCityState && /^\d+/.test(cleaned)) {
      return `${cleaned}, ${defaultLocation}`;
    }
  }
  
  // Return the cleaned message as-is (might already have city/state or be a full address)
  // Google geocoding is good at handling natural language, so we trust it
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    // Set CORS headers for ElevenLabs webhook
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle OPTIONS request for CORS preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 200, headers });
    }

    // Optional: Verify webhook secret for security
    const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401, headers }
        );
      }
    }

    // Get default location from query parameter or environment variable
    // Note: request.url might not include query params in some cases, so we try multiple ways
    let defaultLocation: string | null = null;
    
    try {
      const url = new URL(request.url);
      defaultLocation = 
        url.searchParams.get("default_location") || 
        url.searchParams.get("default_city") ||
        null;
    } catch (e) {
      // If URL parsing fails, try to get from headers or body
      console.log("URL parsing failed, trying alternative methods");
    }
    
    // Fall back to environment variable if query param not found
    if (!defaultLocation) {
      defaultLocation = process.env.DEFAULT_CITY_STATE || null;
    }
    
    // For testing phase, default to Syracuse, NY if nothing is set
    if (!defaultLocation) {
      defaultLocation = "Syracuse, NY";
      console.log("Using hardcoded default location: Syracuse, NY");
    }

    const body = await request.json();
    
    // ElevenLabs webhook format: handles various possible field names
    // Common formats: { message, text, user_input, input, query, transcript }
    const userMessage = 
      body.message || 
      body.address || 
      body.user_input || 
      body.input || 
      body.query ||
      body.transcript ||
      body.content ||
      "";
    
    if (!userMessage || userMessage.trim().length === 0) {
      return NextResponse.json({
        response: "I'm sorry, I didn't catch that. Could you please tell me your address?",
      }, { headers });
    }

    // Extract address from message, using default location if provided
    const address = extractAddress(userMessage, defaultLocation || undefined);
    
    if (!address) {
      return NextResponse.json({
        response: "I need a valid address to find the nearest pantry. Please provide your address, for example: '112 Alden Street' or '112 Alden Street, Syracuse, NY'.",
      }, { headers });
    }

    // Log for debugging (remove in production if needed)
    console.log("Extracted address:", address);
    console.log("Original message:", userMessage);
    console.log("Default location:", defaultLocation);

    // Check for API keys
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      console.error("Google Maps API key not configured");
      console.error("Please set GOOGLE_MAPS_API_KEY in your environment variables");
      return NextResponse.json({
        response: "I'm sorry, the location service is not configured. Please contact support.",
      }, { headers });
    }

    // Geocode the user's address
    let userLat: number;
    let userLng: number;
    let geocodeSuccess = false;
    
    const encodedAddress = encodeURIComponent(address);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleApiKey}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    // Log geocoding result for debugging
    console.log("Geocoding attempt 1:", address, "Status:", geocodeData.status);

    if (geocodeData.status === "OK" && geocodeData.results.length > 0) {
      const userLocation = geocodeData.results[0].geometry.location;
      userLat = userLocation.lat;
      userLng = userLocation.lng;
      geocodeSuccess = true;
    } else {
      // If geocoding failed and we have a default location, try appending it
      if (defaultLocation) {
        const retryAddress = `${address}, ${defaultLocation}`;
        const retryEncoded = encodeURIComponent(retryAddress);
        const retryUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${retryEncoded}&key=${googleApiKey}`;
        
        console.log("Geocoding retry with default location:", retryAddress);
        const retryResponse = await fetch(retryUrl);
        const retryData = await retryResponse.json();
        
        if (retryData.status === "OK" && retryData.results.length > 0) {
          const userLocation = retryData.results[0].geometry.location;
          userLat = userLocation.lat;
          userLng = userLocation.lng;
          geocodeSuccess = true;
          console.log("Geocoding retry succeeded");
        } else {
          console.log("Geocoding retry failed:", retryData.status);
        }
      }
    }

    if (!geocodeSuccess) {
      return NextResponse.json({
        response: `I'm sorry, I couldn't find the location for "${address}". Could you please try providing the full address including city and state?`,
      }, { headers });
    }

    // Fetch pantries from Convex
    let pantries;
    try {
      pantries = await fetchPantries();
    } catch (error: any) {
      console.error("Error fetching pantries:", error);
      return NextResponse.json({
        response: "I'm sorry, I'm having trouble accessing the pantry database. Please try again later.",
      }, { headers });
    }

    if (!pantries || pantries.length === 0) {
      return NextResponse.json({
        response: "I'm sorry, but there are no pantries in the system yet.",
      }, { headers });
    }

    // Filter active pantries
    const activePantries = pantries.filter((p: any) => p.status === "active");

    if (activePantries.length === 0) {
      return NextResponse.json({
        response: "I'm sorry, but there are no active pantries available at the moment.",
      }, { headers });
    }

    // Find nearest pantry
    const pantryDistances = await Promise.all(
      activePantries.map(async (pantry: any, index: number) => {
        try {
          // Add delay for Nominatim rate limiting (1 request per second)
          if (!googleApiKey && index > 0) {
            await new Promise(resolve => setTimeout(resolve, 1100));
          }
          
          const encodedPantryAddress = encodeURIComponent(pantry.address);
          let pantryLat: number;
          let pantryLng: number;
          
          if (googleApiKey) {
            // Use Google Maps
            const pantryGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedPantryAddress}&key=${googleApiKey}`;
            const pantryGeocodeResponse = await fetch(pantryGeocodeUrl);
            const pantryGeocodeData = await pantryGeocodeResponse.json();

            if (pantryGeocodeData.status !== "OK" || pantryGeocodeData.results.length === 0) {
              return null;
            }

            const pantryLocation = pantryGeocodeData.results[0].geometry.location;
            pantryLat = pantryLocation.lat;
            pantryLng = pantryLocation.lng;
          } else {
            // Use Nominatim
            const pantryNominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedPantryAddress}&limit=1&addressdetails=1`;
            const pantryNominatimResponse = await fetch(pantryNominatimUrl, {
              headers: {
                'User-Agent': 'PantryAssistant/1.0'
              }
            });
            const pantryNominatimData = await pantryNominatimResponse.json();

            if (!pantryNominatimData || pantryNominatimData.length === 0) {
              return null;
            }

            pantryLat = parseFloat(pantryNominatimData[0].lat);
            pantryLng = parseFloat(pantryNominatimData[0].lon);
          }

          // Calculate distance using Haversine formula
          const R = 6371; // Earth's radius in km
          const dLat = ((pantryLat - userLat) * Math.PI) / 180;
          const dLng = ((pantryLng - userLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLat * Math.PI) / 180) *
              Math.cos((pantryLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c; // Distance in km

          return {
            pantry,
            distance,
          };
        } catch (error) {
          return null;
        }
      })
    );

    // Filter out null results and sort by distance
    const validPantries = pantryDistances
      .filter((p) => p !== null)
      .sort((a, b) => a!.distance - b!.distance);

    if (validPantries.length === 0) {
      return NextResponse.json({
        response: "I'm sorry, but I couldn't find any pantries near your location.",
      }, { headers });
    }

    const nearest = validPantries[0]!;
    const pantry = nearest.pantry;
    const distance = Math.round(nearest.distance * 10) / 10;

    // Format the response
    let responseText = `The nearest pantry to you is ${pantry.name}, located at ${pantry.address}. `;
    responseText += `It's about ${distance} kilometers away. `;
    
    if (pantry.phoneNumber) {
      responseText += `You can contact them at ${pantry.phoneNumber}. `;
    }
    
    if (pantry.inventory) {
      responseText += `They typically have items like ${pantry.inventory}. `;
    }

    if (pantry.hours && pantry.hours.length > 0) {
      const hoursText = pantry.hours
        .map((h: any) => `${h.day}: ${h.time || "Not specified"}`)
        .join(", ");
      responseText += `Their hours are: ${hoursText}. `;
    }

    return NextResponse.json({
      response: responseText.trim(),
    }, { headers });
  } catch (error: any) {
    console.error("ElevenLabs agent webhook error:", error);
    return NextResponse.json({
      response: "I'm sorry, I encountered an error while processing your request. Please try again.",
    }, { 
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  }
}

// Also support GET for health checks
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "ElevenLabs agent webhook is ready",
    endpoint: "/api/elevenlabs/agent",
  });
}

