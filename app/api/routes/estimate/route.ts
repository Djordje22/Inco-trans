import { NextResponse } from "next/server";
import { buildRoutePriceEstimate } from "@/lib/pricing";
import { getGoogleMapsApiKey, type PlacePoint } from "@/lib/google-maps";

export const runtime = "nodejs";

const asNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asPoint = (value: unknown): PlacePoint | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const latitude = asNumber(record.latitude);
  const longitude = asNumber(record.longitude);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }
  return { latitude, longitude };
};

const waypoint = (point: PlacePoint) => ({
  location: {
    latLng: {
      latitude: point.latitude,
      longitude: point.longitude
    }
  }
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawPoints: unknown[] = Array.isArray(body?.points) ? body.points : [];
  const points: PlacePoint[] = rawPoints
    .map(asPoint)
    .filter((point): point is PlacePoint => Boolean(point));
  const waitingHours =
    typeof body?.waitingHours === "number" ? Math.max(0, body.waitingHours) : 0;
  const chauffeurDurationHours =
    typeof body?.chauffeurDurationHours === "number"
      ? Math.max(4, body.chauffeurDurationHours)
      : undefined;
  const pricingModel =
    body?.service === "business"
      ? "long_distance"
      : body?.service === "chauffeur"
        ? "chauffeur"
        : "airport";

  if (points.length < 2) {
    return NextResponse.json(
      { available: false, reason: "Route needs pickup and destination coordinates." },
      { status: 200 }
    );
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { available: false, reason: "Google Maps API key is not configured." },
      { status: 200 }
    );
  }

  const [origin, ...rest] = points;
  const destination = rest[rest.length - 1];
  const intermediates = rest.slice(0, -1);

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration"
    },
    body: JSON.stringify({
      origin: waypoint(origin as PlacePoint),
      destination: waypoint(destination as PlacePoint),
      intermediates: intermediates.map((point) => waypoint(point as PlacePoint)),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
      units: "METRIC",
      languageCode: "en"
    })
  });

  if (!response.ok) {
    return NextResponse.json(
      { available: false, reason: "Route estimate is unavailable." },
      { status: 200 }
    );
  }

  const data = await response.json();
  const route = data.routes?.[0];
  const distanceMeters = asNumber(route?.distanceMeters);
  if (distanceMeters === null) {
    return NextResponse.json(
      { available: false, reason: "Route estimate is unavailable." },
      { status: 200 }
    );
  }

  const durationSeconds =
    typeof route.duration === "string"
      ? Number(route.duration.replace("s", ""))
      : undefined;

  return NextResponse.json(
    {
      available: true,
      estimate: buildRoutePriceEstimate({
        distanceMeters,
        durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
        waitingHours,
        chauffeurDurationHours,
        pricingModel
      })
    },
    { status: 200 }
  );
}
