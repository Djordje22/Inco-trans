export const MIN_PASSENGERS = 1;
export const MAX_PASSENGERS = 4;
export const MIN_LUGGAGE = 0;
export const MAX_LUGGAGE = 6;

export function clampBookingCount(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.trunc(value), min), max);
}
