import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, pantries } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    if (!pantries || !Array.isArray(pantries)) {
      return NextResponse.json(
        { error: "Pantries array is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Geocode all pantry addresses and calculate distances
    const pantryDistances = await Promise.all(
      pantries.map(async (pantry: any) => {
        try {
          const encodedAddress = encodeURIComponent(pantry.address);
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
          
          const geocodeResponse = await fetch(geocodeUrl);
          const geocodeData = await geocodeResponse.json();

          if (geocodeData.status !== "OK" || geocodeData.results.length === 0) {
            return {
              pantry,
              distance: null,
              error: "Could not geocode address",
            };
          }

          const pantryLocation = geocodeData.results[0].geometry.location;
          const pantryLat = pantryLocation.lat;
          const pantryLng = pantryLocation.lng;

          // Calculate distance using Haversine formula (simple approximation)
          const R = 6371; // Earth's radius in km
          const dLat = ((pantryLat - lat) * Math.PI) / 180;
          const dLng = ((pantryLng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((pantryLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c; // Distance in km

          return {
            pantry,
            distance,
            coordinates: {
              lat: pantryLat,
              lng: pantryLng,
            },
          };
        } catch (error: any) {
          return {
            pantry,
            distance: null,
            error: error.message,
          };
        }
      })
    );

    // Filter out pantries with errors and sort by distance
    const validPantries = pantryDistances
      .filter((p) => p.distance !== null)
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

    return NextResponse.json({
      nearest: validPantries[0] || null,
      all: validPantries,
    });
  } catch (error: any) {
    console.error("Find nearest pantries error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to find nearest pantries" },
      { status: 500 }
    );
  }
}

