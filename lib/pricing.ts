export type RoutePriceEstimate = {
  pricingModel: "airport" | "long_distance";
  distanceMeters: number;
  durationSeconds?: number;
  distanceKm: number;
  includedDistanceKm: number;
  distanceOverageKm: number;
  distanceOverageRate: number;
  basePrice: number;
  waitingHours: number;
  waitingHourlyRate: number;
  waitingPrice: number;
  overagePrice: number;
  totalPrice: number;
  currency: "EUR";
  source: "google_routes";
};

export const INCLUDED_DISTANCE_KM = 25;
export const BASE_TRANSFER_PRICE = 30;
export const WAITING_HOURLY_RATE = 30;
export const AIRPORT_DISTANCE_OVERAGE_RATE = 1;
export const LONG_DISTANCE_RATE = 1;

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const roundDistance = (value: number) => Math.round(value * 10) / 10;

export function buildRoutePriceEstimate({
  distanceMeters,
  durationSeconds,
  waitingHours,
  pricingModel
}: {
  distanceMeters: number;
  durationSeconds?: number;
  waitingHours: number;
  pricingModel?: RoutePriceEstimate["pricingModel"];
}): RoutePriceEstimate {
  const distanceKm = roundDistance(distanceMeters / 1000);
  const safeWaitingHours = Number.isFinite(waitingHours)
    ? Math.max(0, Math.trunc(waitingHours))
    : 0;
  const model = pricingModel ?? "airport";
  const distanceOverageKm =
    model === "airport"
      ? roundDistance(Math.max(0, distanceKm - INCLUDED_DISTANCE_KM))
      : distanceKm;
  const waitingPrice = roundMoney(safeWaitingHours * WAITING_HOURLY_RATE);
  const distanceRate =
    model === "airport" ? AIRPORT_DISTANCE_OVERAGE_RATE : LONG_DISTANCE_RATE;
  const overagePrice = roundMoney(distanceOverageKm * distanceRate);
  const basePrice = model === "airport" ? BASE_TRANSFER_PRICE : 0;

  return {
    pricingModel: model,
    distanceMeters,
    durationSeconds,
    distanceKm,
    includedDistanceKm: model === "airport" ? INCLUDED_DISTANCE_KM : 0,
    distanceOverageKm,
    distanceOverageRate: distanceRate,
    basePrice,
    waitingHours: safeWaitingHours,
    waitingHourlyRate: WAITING_HOURLY_RATE,
    waitingPrice,
    overagePrice,
    totalPrice: roundMoney(basePrice + waitingPrice + overagePrice),
    currency: "EUR",
    source: "google_routes"
  };
}
