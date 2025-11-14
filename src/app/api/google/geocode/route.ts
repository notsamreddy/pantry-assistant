import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
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

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status}` },
        { status: 400 }
      );
    }

    if (data.results.length === 0) {
      return NextResponse.json(
        { error: "No results found for this address" },
        { status: 404 }
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return NextResponse.json({
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
    });
  } catch (error: any) {
    console.error("Google Geocoding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to geocode address" },
      { status: 500 }
    );
  }
}

