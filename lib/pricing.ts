export type RoutePriceEstimate = {
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

export const INCLUDED_DISTANCE_KM = 50;
export const BASE_TRANSFER_PRICE = 35;
export const WAITING_HOURLY_RATE = 30;
export const DISTANCE_OVERAGE_RATE = 0.6;

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const roundDistance = (value: number) => Math.round(value * 10) / 10;

export function buildRoutePriceEstimate({
  distanceMeters,
  durationSeconds,
  waitingHours
}: {
  distanceMeters: number;
  durationSeconds?: number;
  waitingHours: number;
}): RoutePriceEstimate {
  const distanceKm = roundDistance(distanceMeters / 1000);
  const safeWaitingHours = Number.isFinite(waitingHours)
    ? Math.max(0, Math.trunc(waitingHours))
    : 0;
  const distanceOverageKm = roundDistance(
    Math.max(0, distanceKm - INCLUDED_DISTANCE_KM)
  );
  const waitingPrice = roundMoney(safeWaitingHours * WAITING_HOURLY_RATE);
  const overagePrice = roundMoney(distanceOverageKm * DISTANCE_OVERAGE_RATE);

  return {
    distanceMeters,
    durationSeconds,
    distanceKm,
    includedDistanceKm: INCLUDED_DISTANCE_KM,
    distanceOverageKm,
    distanceOverageRate: DISTANCE_OVERAGE_RATE,
    basePrice: BASE_TRANSFER_PRICE,
    waitingHours: safeWaitingHours,
    waitingHourlyRate: WAITING_HOURLY_RATE,
    waitingPrice,
    overagePrice,
    totalPrice: roundMoney(BASE_TRANSFER_PRICE + waitingPrice + overagePrice),
    currency: "EUR",
    source: "google_routes"
  };
}
