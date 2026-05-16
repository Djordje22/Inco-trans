import { NextResponse } from "next/server";
import type { Locale } from "@/lib/site-config";
import {
  getGoogleMapsApiKey,
  googleLanguageCode,
  type NormalizedPlaceSuggestion
} from "@/lib/google-maps";

export const runtime = "nodejs";

const locales = new Set(["sr", "en", "ru"]);

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = asString(body?.input);
  const locale = asString(body?.locale) || "sr";
  const sessionToken = asString(body?.sessionToken);

  if (!locales.has(locale)) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  if (input.length < 3) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { suggestions: [], unavailable: true, reason: "Google Maps API key is not configured." },
      { status: 200 }
    );
  }

  const params = new URLSearchParams({
    input,
    key: apiKey,
    language: googleLanguageCode(locale as Locale),
    location: "44.8125,20.4612",
    radius: "550000",
    strictbounds: "true"
  });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
  );

  if (!response.ok) {
    return NextResponse.json(
      { suggestions: [], unavailable: true, reason: "Address suggestions are unavailable." },
      { status: 200 }
    );
  }

  const data = await response.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json(
      { suggestions: [], unavailable: true, reason: "Address suggestions are unavailable." },
      { status: 200 }
    );
  }

  const suggestions: NormalizedPlaceSuggestion[] = (data.predictions ?? [])
    .map((prediction: any) => ({
      placeId: prediction.place_id,
      text: prediction.description ?? "",
      mainText: prediction.structured_formatting?.main_text ?? prediction.description ?? "",
      secondaryText: prediction.structured_formatting?.secondary_text
    }))
    .filter((suggestion: NormalizedPlaceSuggestion) => suggestion.placeId && suggestion.text);

  return NextResponse.json({ suggestions }, { status: 200 });
}
