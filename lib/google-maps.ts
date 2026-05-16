import type { Locale } from "@/lib/site-config";

export type PlacePoint = {
  latitude: number;
  longitude: number;
};

export type NormalizedPlaceSuggestion = {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText?: string;
};

export type NormalizedPlaceDetails = {
  placeId: string;
  label: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  countryCode?: string;
};

export const SUPPORTED_PLACE_REGION_CODES = [
  "rs",
  "ba",
  "me",
  "hr",
  "mk",
  "bg",
  "ro",
  "al"
];

const localeToLanguageCode = (locale: Locale) =>
  locale === "sr" ? "sr-Latn" : locale;

export function getGoogleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY;
}

export function googleLanguageCode(locale: Locale) {
  return localeToLanguageCode(locale);
}

export function isSupportedRegionCode(value?: string) {
  return value
    ? SUPPORTED_PLACE_REGION_CODES.includes(value.toLowerCase())
    : false;
}
