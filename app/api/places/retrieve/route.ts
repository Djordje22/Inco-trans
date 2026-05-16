import { NextResponse } from "next/server";
import type { Locale } from "@/lib/site-config";
import {
  getGoogleMapsApiKey,
  googleLanguageCode,
  isSupportedRegionCode,
  type NormalizedPlaceDetails
} from "@/lib/google-maps";

export const runtime = "nodejs";

const locales = new Set(["sr", "en", "ru"]);

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const countryCodeFromComponents = (components: any[]) => {
  const country = components.find((component) =>
    Array.isArray(component.types) && component.types.includes("country")
  );
  return asString(country?.shortText || country?.short_name).toLowerCase();
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const placeId = asString(body?.placeId);
  const locale = asString(body?.locale) || "sr";
  const sessionToken = asString(body?.sessionToken);

  if (!placeId || !locales.has(locale)) {
    return NextResponse.json({ error: "Invalid place request." }, { status: 400 });
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { unavailable: true, reason: "Google Maps API key is not configured." },
      { status: 200 }
    );
  }

  const params = new URLSearchParams({
    key: apiKey,
    place_id: placeId,
    language: googleLanguageCode(locale as Locale),
    fields: "place_id,name,formatted_address,geometry,address_component"
  });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`
  );

  if (!response.ok) {
    return NextResponse.json(
      { unavailable: true, reason: "Address details are unavailable." },
      { status: 200 }
    );
  }

  const data = await response.json();
  if (data.status !== "OK") {
    return NextResponse.json(
      { unavailable: true, reason: "Address details are unavailable." },
      { status: 200 }
    );
  }

  const result = data.result;
  const countryCode = countryCodeFromComponents(result?.address_components ?? []);
  if (countryCode && !isSupportedRegionCode(countryCode)) {
    return NextResponse.json(
      { unavailable: true, reason: "Selected address is outside the supported region." },
      { status: 200 }
    );
  }

  if (!result?.geometry?.location?.lat || !result?.geometry?.location?.lng) {
    return NextResponse.json(
      { unavailable: true, reason: "Selected address does not include coordinates." },
      { status: 200 }
    );
  }

  const place: NormalizedPlaceDetails = {
    placeId: result.place_id ?? placeId,
    label: result.formatted_address ?? result.name ?? placeId,
    formattedAddress: result.formatted_address ?? result.name ?? placeId,
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    countryCode: countryCode || undefined
  };

  return NextResponse.json({ place }, { status: 200 });
}
