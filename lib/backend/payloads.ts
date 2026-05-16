import type { Locale } from "@/lib/site-config";

export type BookingService = "airport" | "chauffeur" | "business" | "other";
export type AirportDirection = "from" | "to" | "";
export type PreferredCommunication = "phone_sms" | "viber_whatsapp" | "email" | "";
export type PaymentMethod = "card" | "cash";
export type RequestSource = "quote_form" | "reservation_modal" | "handle_everything";

export type BookingRequestPayload = {
  locale: Locale;
  source: RequestSource;
  service: BookingService;
  airportDirection?: AirportDirection;
  pickup: string;
  destination: string;
  stops?: string[];
  waitingHours?: number;
  dateTime: string;
  passengers: number;
  luggage?: number;
  flight?: string;
  vehicle?: string;
  fullName: string;
  email?: string;
  phoneCountryCode?: string;
  phone: string;
  companyName?: string;
  preferredCommunication?: PreferredCommunication;
  paymentMethod?: PaymentMethod;
  message?: string;
  termsAccepted?: boolean;
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
  message: string;
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
  const fullName = asString(data.fullName);
  const email = asString(data.email);
  const phone = asString(data.phone);
  const passengers = asInteger(data.passengers, 1);
  const luggage = asInteger(data.luggage, 0);
  const waitingHours = asInteger(data.waitingHours, 0);

  if (!locales.has(locale)) return { ok: false, error: "Unsupported locale." };
  if (!sources.has(source)) return { ok: false, error: "Unsupported source." };
  if (!services.has(service)) return { ok: false, error: "Unsupported service." };
  if (!airportDirections.has(airportDirection)) {
    return { ok: false, error: "Unsupported airport direction." };
  }
  if (!pickup || !destination || !dateTime) {
    return { ok: false, error: "Pickup, destination and date/time are required." };
  }
  if (passengers < 1 || passengers > 20) {
    return { ok: false, error: "Passenger count is outside the allowed range." };
  }
  if (luggage < 0 || luggage > 20) {
    return { ok: false, error: "Luggage count is outside the allowed range." };
  }
  if (!fullName || phone.length < 5) {
    return { ok: false, error: "Name and phone are required." };
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
      waitingHours,
      dateTime,
      passengers,
      luggage,
      flight: asOptionalString(data.flight),
      vehicle: asOptionalString(data.vehicle),
      fullName,
      email: asOptionalString(email),
      phoneCountryCode: asOptionalString(data.phoneCountryCode),
      phone,
      companyName: asOptionalString(data.companyName),
      preferredCommunication: preferredCommunication as PreferredCommunication,
      paymentMethod: paymentMethod as PaymentMethod,
      message: asOptionalString(data.message),
      termsAccepted: Boolean(data.termsAccepted)
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
      message
    }
  };
}
