import type { Locale } from "@/lib/site-config";
import type { RoutePriceEstimate } from "@/lib/pricing";

export type BookingService = "airport" | "chauffeur" | "business" | "other";
export type AirportDirection = "from" | "to" | "";
export type PreferredCommunication = "phone_sms" | "viber_whatsapp" | "email" | "";
export type PaymentMethod = "card" | "cash";
export type RequestSource = "quote_form" | "reservation_modal" | "handle_everything";

export type BookingPlace = {
  placeId?: string;
  label: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  countryCode?: string;
};

export type BookingRequestPayload = {
  locale: Locale;
  source: RequestSource;
  service: BookingService;
  airportDirection?: AirportDirection;
  pickup: string;
  destination: string;
  stops?: string[];
  pickupPlace?: BookingPlace;
  destinationPlace?: BookingPlace;
  stopPlaces?: BookingPlace[];
  waitingHours?: number;
  dateTime: string;
  dropoffDateTime?: string;
  chauffeurDurationHours?: number;
  passengers: number;
  luggage?: number;
  wifi?: boolean;
  flight?: string;
  fullName: string;
  email?: string;
  phoneCountryCode?: string;
  phone: string;
  companyName?: string;
  companyVatNumber?: string;
  companyAddress?: string;
  preferredCommunication?: PreferredCommunication;
  paymentMethod?: PaymentMethod;
  message?: string;
  bookingForOther?: boolean;
  passengerName?: string;
  passengerPhoneCountryCode?: string;
  passengerPhone?: string;
  reminderRequested?: boolean;
  reminderMinutesBefore?: number;
  promoCode?: string;
  promoDiscountPercent?: number;
  termsAccepted?: boolean;
  priceEstimate?: RoutePriceEstimate;
};

export type ContactMessagePayload = {
  locale: Locale;
  source?: "contact_page" | "reservation_modal";
  fullName: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  preferredCommunication?: PreferredCommunication;
  companyName?: string;
  companyVatNumber?: string;
  companyAddress?: string;
  message: string;
  bookingForOther?: boolean;
  passengerName?: string;
  passengerPhoneCountryCode?: string;
  passengerPhone?: string;
};

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const locales = new Set(["sr", "en", "ru"]);
const services = new Set(["airport", "chauffeur", "business", "other"]);
const airportDirections = new Set(["from", "to", ""]);
const communicationMethods = new Set(["phone_sms", "viber_whatsapp", "email", ""]);
const paymentMethods = new Set(["card", "cash"]);
const sources = new Set(["quote_form", "reservation_modal", "handle_everything"]);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const asOptionalString = (value: unknown) => {
  const next = asString(value);
  return next.length > 0 ? next : undefined;
};

const asInteger = (value: unknown, fallback: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => asString(item)).filter((item) => item.length > 0)
    : [];

const asNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asOptionalPlace = (value: unknown): BookingPlace | undefined => {
  const data = asRecord(value);
  if (!data) return undefined;

  const label = asString(data.label);
  if (!label) return undefined;

  return {
    placeId: asOptionalString(data.placeId),
    label,
    formattedAddress: asOptionalString(data.formattedAddress),
    latitude: asNumber(data.latitude),
    longitude: asNumber(data.longitude),
    countryCode: asOptionalString(data.countryCode)
  };
};

const asPlaceArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map(asOptionalPlace).filter((place): place is BookingPlace => Boolean(place))
    : [];

const asOptionalPriceEstimate = (value: unknown): RoutePriceEstimate | undefined => {
  const data = asRecord(value);
  if (!data) return undefined;

  const rawPricingModel = asString(data.pricingModel);
  const pricingModel =
    rawPricingModel === "long_distance" || rawPricingModel === "chauffeur"
      ? rawPricingModel
      : "airport";
  const distanceMeters = asNumber(data.distanceMeters);
  const distanceKm = asNumber(data.distanceKm);
  const includedDistanceKm = asNumber(data.includedDistanceKm);
  const distanceOverageKm = asNumber(data.distanceOverageKm);
  const distanceOverageRate = asNumber(data.distanceOverageRate);
  const basePrice = asNumber(data.basePrice);
  const waitingHours = asNumber(data.waitingHours);
  const waitingHourlyRate = asNumber(data.waitingHourlyRate);
  const waitingPrice = asNumber(data.waitingPrice);
  const overagePrice = asNumber(data.overagePrice);
  const totalPrice = asNumber(data.totalPrice);

  if (
    distanceMeters === undefined ||
    distanceKm === undefined ||
    includedDistanceKm === undefined ||
    distanceOverageKm === undefined ||
    distanceOverageRate === undefined ||
    basePrice === undefined ||
    waitingHours === undefined ||
    waitingHourlyRate === undefined ||
    waitingPrice === undefined ||
    overagePrice === undefined ||
    totalPrice === undefined
  ) {
    return undefined;
  }

  return {
    pricingModel,
    distanceMeters,
    durationSeconds: asNumber(data.durationSeconds),
    distanceKm,
    includedDistanceKm,
    distanceOverageKm,
    distanceOverageRate,
    basePrice,
    waitingHours,
    waitingHourlyRate,
    waitingPrice,
    overagePrice,
    totalPrice,
    chauffeurDurationHours: asNumber(data.chauffeurDurationHours),
    chauffeurIncludedHours: asNumber(data.chauffeurIncludedHours),
    chauffeurExtraHours: asNumber(data.chauffeurExtraHours),
    chauffeurExtraHourlyRate: asNumber(data.chauffeurExtraHourlyRate),
    currency: "EUR",
    source: "google_routes"
  };
};

const isEmailLike = (value: string) =>
  value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function validateBookingRequestPayload(
  payload: unknown
): ValidationResult<BookingRequestPayload> {
  const data = asRecord(payload);
  if (!data) return { ok: false, error: "Invalid request body." };

  const locale = asString(data.locale);
  const source = asString(data.source);
  const service = asString(data.service);
  const airportDirection = asString(data.airportDirection);
  const pickup = asString(data.pickup);
  const destination = asString(data.destination);
  const dateTime = asString(data.dateTime);
  const dropoffDateTime = asString(data.dropoffDateTime);
  const fullName = asString(data.fullName);
  const email = asString(data.email);
  const phone = asString(data.phone);
  const passengers = asInteger(data.passengers, 1);
  const luggage = asInteger(data.luggage, 0);
  const wifi = typeof data.wifi === "boolean" ? data.wifi : true;
  const waitingHours = asInteger(data.waitingHours, 0);
  const chauffeurDurationHours = asInteger(data.chauffeurDurationHours, 0);
  const bookingForOther = Boolean(data.bookingForOther);
  const passengerName = asString(data.passengerName);
  const passengerPhone = asString(data.passengerPhone);
  const reminderRequested = Boolean(data.reminderRequested);
  const reminderMinutesBefore = asInteger(data.reminderMinutesBefore, 5);

  if (!locales.has(locale)) return { ok: false, error: "Unsupported locale." };
  if (!sources.has(source)) return { ok: false, error: "Unsupported source." };
  if (!services.has(service)) return { ok: false, error: "Unsupported service." };
  if (!airportDirections.has(airportDirection)) {
    return { ok: false, error: "Unsupported airport direction." };
  }
  if (!pickup || !destination || !dateTime) {
    return { ok: false, error: "Pickup, destination and date/time are required." };
  }
  if (service === "chauffeur" && (!dropoffDateTime || chauffeurDurationHours < 4)) {
    return { ok: false, error: "Chauffeur service end time and duration are required." };
  }
  if (passengers < 1 || passengers > 4) {
    return { ok: false, error: "Passenger count is outside the allowed range." };
  }
  if (luggage < 0 || luggage > 4) {
    return { ok: false, error: "Luggage count is outside the allowed range." };
  }
  if (!fullName || phone.length < 5) {
    return { ok: false, error: "Name and phone are required." };
  }
  if (bookingForOther && (passengerName.length < 2 || passengerPhone.length < 5)) {
    return { ok: false, error: "Passenger name and phone are required." };
  }
  if (!isEmailLike(email)) return { ok: false, error: "Invalid email address." };

  const preferredCommunication = asString(data.preferredCommunication);
  const paymentMethod = asString(data.paymentMethod) || "cash";
  if (!communicationMethods.has(preferredCommunication)) {
    return { ok: false, error: "Unsupported communication preference." };
  }
  if (!paymentMethods.has(paymentMethod)) {
    return { ok: false, error: "Unsupported payment method." };
  }

  return {
    ok: true,
    value: {
      locale: locale as Locale,
      source: source as RequestSource,
      service: service as BookingService,
      airportDirection: airportDirection as AirportDirection,
      pickup,
      destination,
      stops: asStringArray(data.stops),
      pickupPlace: asOptionalPlace(data.pickupPlace),
      destinationPlace: asOptionalPlace(data.destinationPlace),
      stopPlaces: asPlaceArray(data.stopPlaces),
      waitingHours,
      dateTime,
      dropoffDateTime: asOptionalString(dropoffDateTime),
      chauffeurDurationHours:
        service === "chauffeur" ? Math.max(4, chauffeurDurationHours) : undefined,
      passengers,
      luggage,
      wifi,
      flight: asOptionalString(data.flight),
      fullName,
      email: asOptionalString(email),
      phoneCountryCode: asOptionalString(data.phoneCountryCode),
      phone,
      companyName: asOptionalString(data.companyName),
      companyVatNumber: asOptionalString(data.companyVatNumber),
      companyAddress: asOptionalString(data.companyAddress),
      preferredCommunication: preferredCommunication as PreferredCommunication,
      paymentMethod: paymentMethod as PaymentMethod,
      message: asOptionalString(data.message),
      bookingForOther,
      passengerName: asOptionalString(passengerName),
      passengerPhoneCountryCode: asOptionalString(data.passengerPhoneCountryCode),
      passengerPhone: asOptionalString(passengerPhone),
      reminderRequested,
      reminderMinutesBefore: Math.max(1, Math.min(24 * 60, reminderMinutesBefore)),
      promoCode: asOptionalString(data.promoCode),
      promoDiscountPercent: Math.max(0, Math.min(100, asNumber(data.promoDiscountPercent) ?? 0)),
      termsAccepted: Boolean(data.termsAccepted),
      priceEstimate: asOptionalPriceEstimate(data.priceEstimate)
    }
  };
}

export function validateContactMessagePayload(
  payload: unknown
): ValidationResult<ContactMessagePayload> {
  const data = asRecord(payload);
  if (!data) return { ok: false, error: "Invalid request body." };

  const locale = asString(data.locale);
  const source = asString(data.source) || "contact_page";
  const fullName = asString(data.fullName);
  const email = asString(data.email);
  const phone = asString(data.phone);
  const message = asString(data.message);
  const preferredCommunication = asString(data.preferredCommunication);
  const bookingForOther = Boolean(data.bookingForOther);
  const passengerName = asString(data.passengerName);
  const passengerPhone = asString(data.passengerPhone);

  if (!locales.has(locale)) return { ok: false, error: "Unsupported locale." };
  if (source !== "contact_page" && source !== "reservation_modal") {
    return { ok: false, error: "Unsupported source." };
  }
  if (fullName.length < 2) return { ok: false, error: "Name is required." };
  if (!email && phone.length < 5) {
    return { ok: false, error: "Email or phone is required." };
  }
  if (!isEmailLike(email)) return { ok: false, error: "Invalid email address." };
  if (!message && source === "contact_page") {
    return { ok: false, error: "Message is required." };
  }
  if (!message && source === "reservation_modal") {
    return { ok: false, error: "Message is required." };
  }
  if (bookingForOther && (passengerName.length < 2 || passengerPhone.length < 5)) {
    return { ok: false, error: "Passenger name and phone are required." };
  }
  if (!communicationMethods.has(preferredCommunication)) {
    return { ok: false, error: "Unsupported communication preference." };
  }

  return {
    ok: true,
    value: {
      locale: locale as Locale,
      source: source as ContactMessagePayload["source"],
      fullName,
      email: asOptionalString(email),
      phone: asOptionalString(phone),
      phoneCountryCode: asOptionalString(data.phoneCountryCode),
      preferredCommunication: preferredCommunication as PreferredCommunication,
      companyName: asOptionalString(data.companyName),
      companyVatNumber: asOptionalString(data.companyVatNumber),
      companyAddress: asOptionalString(data.companyAddress),
      message,
      bookingForOther,
      passengerName: asOptionalString(passengerName),
      passengerPhoneCountryCode: asOptionalString(data.passengerPhoneCountryCode),
      passengerPhone: asOptionalString(passengerPhone)
    }
  };
}
