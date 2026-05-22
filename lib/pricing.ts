export type RoutePriceEstimate = {
  pricingModel: "airport" | "long_distance" | "chauffeur";
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
  chauffeurDurationHours?: number;
  chauffeurIncludedHours?: number;
  chauffeurExtraHours?: number;
  chauffeurExtraHourlyRate?: number;
  currency: "EUR";
  source: "google_routes";
};

export const INCLUDED_DISTANCE_KM = 25;
export const BASE_TRANSFER_PRICE = 30;
export const WAITING_HOURLY_RATE = 30;
export const AIRPORT_DISTANCE_OVERAGE_RATE = 1.15;
export const LONG_DISTANCE_RATE = 1.15;
export const CHAUFFEUR_DISTANCE_OVERAGE_RATE = 1.15;
export const CHAUFFEUR_EXTRA_HOURLY_RATE = 30;
const CHAUFFEUR_DURATION_GRACE_MINUTES = 15;

const CHAUFFEUR_TIERS = [
  { maxHours: 4, includedDistanceKm: 50, basePrice: 100 },
  { maxHours: 6, includedDistanceKm: 100, basePrice: 140 },
  { maxHours: 8, includedDistanceKm: 150, basePrice: 170 },
  { maxHours: 10, includedDistanceKm: 200, basePrice: 200 }
];

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const roundDistance = (value: number) => Math.round(value * 10) / 10;
const billableChauffeurDurationHours = (value: number | undefined) => {
  if (!Number.isFinite(value)) return 4;
  const durationHours = value as number;
  const wholeHours = Math.floor(durationHours);
  const extraMinutes = Math.round((durationHours - wholeHours) * 60);
  const billable =
    extraMinutes <= CHAUFFEUR_DURATION_GRACE_MINUTES
      ? wholeHours
      : Math.ceil(durationHours);
  return Math.max(4, billable);
};

export function buildRoutePriceEstimate({
  distanceMeters,
  durationSeconds,
  waitingHours,
  chauffeurDurationHours,
  pricingModel
}: {
  distanceMeters: number;
  durationSeconds?: number;
  waitingHours: number;
  chauffeurDurationHours?: number;
  pricingModel?: RoutePriceEstimate["pricingModel"];
}): RoutePriceEstimate {
  const distanceKm = roundDistance(distanceMeters / 1000);
  const safeWaitingHours = Number.isFinite(waitingHours)
    ? Math.max(0, Math.trunc(waitingHours))
    : 0;
  const model = pricingModel ?? "airport";
  const safeChauffeurDurationHours =
    billableChauffeurDurationHours(chauffeurDurationHours);
  const chauffeurTier =
    model === "chauffeur"
      ? CHAUFFEUR_TIERS.find((tier) => safeChauffeurDurationHours <= tier.maxHours) ??
        CHAUFFEUR_TIERS[CHAUFFEUR_TIERS.length - 1]
      : undefined;
  const chauffeurExtraHours =
    model === "chauffeur" ? Math.max(0, safeChauffeurDurationHours - 10) : 0;
  const distanceOverageKm =
    model === "airport"
      ? roundDistance(Math.max(0, distanceKm - INCLUDED_DISTANCE_KM))
      : model === "chauffeur"
        ? roundDistance(
            Math.max(0, distanceKm - (chauffeurTier?.includedDistanceKm ?? 0))
          )
        : distanceKm;
  const waitingPrice =
    model === "chauffeur"
      ? roundMoney(chauffeurExtraHours * CHAUFFEUR_EXTRA_HOURLY_RATE)
      : roundMoney(safeWaitingHours * WAITING_HOURLY_RATE);
  const distanceRate =
    model === "airport"
      ? AIRPORT_DISTANCE_OVERAGE_RATE
      : model === "chauffeur"
        ? CHAUFFEUR_DISTANCE_OVERAGE_RATE
        : LONG_DISTANCE_RATE;
  const overagePrice = roundMoney(distanceOverageKm * distanceRate);
  const basePrice =
    model === "airport"
      ? BASE_TRANSFER_PRICE
      : model === "chauffeur"
        ? chauffeurTier?.basePrice ?? 0
        : 0;

  return {
    pricingModel: model,
    distanceMeters,
    durationSeconds,
    distanceKm,
    includedDistanceKm:
      model === "airport"
        ? INCLUDED_DISTANCE_KM
        : model === "chauffeur"
          ? chauffeurTier?.includedDistanceKm ?? 0
          : 0,
    distanceOverageKm,
    distanceOverageRate: distanceRate,
    basePrice,
    waitingHours: model === "chauffeur" ? chauffeurExtraHours : safeWaitingHours,
    waitingHourlyRate:
      model === "chauffeur" ? CHAUFFEUR_EXTRA_HOURLY_RATE : WAITING_HOURLY_RATE,
    waitingPrice,
    overagePrice,
    totalPrice: roundMoney(basePrice + waitingPrice + overagePrice),
    chauffeurDurationHours:
      model === "chauffeur" ? safeChauffeurDurationHours : undefined,
    chauffeurIncludedHours: model === "chauffeur" ? chauffeurTier?.maxHours : undefined,
    chauffeurExtraHours: model === "chauffeur" ? chauffeurExtraHours : undefined,
    chauffeurExtraHourlyRate:
      model === "chauffeur" ? CHAUFFEUR_EXTRA_HOURLY_RATE : undefined,
    currency: "EUR",
    source: "google_routes"
  };
}
