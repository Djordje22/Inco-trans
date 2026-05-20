import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { validateBookingRequestPayload } from "@/lib/backend/payloads";
import { sendReservationEmails } from "@/lib/email/reservation-receipt";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { BookingRequestPayload } from "@/lib/backend/payloads";

export const runtime = "nodejs";

function messageWithExtras(payload: BookingRequestPayload) {
  const lines = [payload.message?.trim() ?? ""].filter(Boolean);

  if (payload.bookingForOther) {
    lines.push(
      "Rezervacija za drugu osobu:",
      `Ime putnika: ${payload.passengerName ?? ""}`,
      `Telefon putnika: ${[payload.passengerPhoneCountryCode, payload.passengerPhone]
        .filter(Boolean)
        .join(" ")}`
    );
  }

  if (payload.reminderRequested) {
    lines.push(
      `Podsetnik: da, ${payload.reminderMinutesBefore ?? 5} minuta nakon slanja zahteva`
    );
  }

  if (payload.service === "chauffeur") {
    lines.push(
      "Šofer servis:",
      `Do datum i vreme: ${payload.dropoffDateTime ?? ""}`,
      `Trajanje: ${payload.chauffeurDurationHours ?? ""}h`
    );
  }

  return lines.join("\n");
}

function bookingInsertPayload(id: string, payload: BookingRequestPayload) {
  return {
    id,
    locale: payload.locale,
    source: payload.source,
    service: payload.service,
    airport_direction: payload.airportDirection || null,
    pickup: payload.pickup,
    destination: payload.destination,
    waiting_hours: payload.waitingHours ?? 0,
    pickup_at: payload.dateTime,
    passengers: payload.passengers,
    luggage: payload.luggage ?? 0,
    wifi_requested: payload.wifi ?? true,
    flight_number: payload.flight || null,
    vehicle_slug: payload.vehicle || null,
    full_name: payload.fullName,
    email: payload.email || null,
    phone_country_code: payload.phoneCountryCode || null,
    phone: payload.phone,
    company_name: payload.companyName || null,
    preferred_communication: payload.preferredCommunication || null,
    payment_method: payload.paymentMethod || "cash",
    pickup_place: payload.pickupPlace ?? null,
    destination_place: payload.destinationPlace ?? null,
    route_distance_meters: payload.priceEstimate?.distanceMeters ?? null,
    route_duration_seconds: payload.priceEstimate?.durationSeconds ?? null,
    price_estimate: payload.priceEstimate ?? null,
    message: messageWithExtras(payload) || null,
    terms_accepted: payload.termsAccepted ?? false,
    status: "new"
  };
}

function legacyBookingInsertPayload(
  payload: ReturnType<typeof bookingInsertPayload>
) {
  const {
    wifi_requested,
    pickup_place,
    destination_place,
    route_distance_meters,
    route_duration_seconds,
    price_estimate,
    ...legacyPayload
  } = payload;
  void wifi_requested;
  void pickup_place;
  void destination_place;
  void route_distance_meters;
  void route_duration_seconds;
  void price_estimate;
  return legacyPayload;
}

export async function POST(request: Request) {
  const parsed = validateBookingRequestPayload(await request.json().catch(() => null));

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Backend is not configured. Add Supabase environment variables." },
      { status: 503 }
    );
  }

  const payload = parsed.value;
  const id = randomUUID();
  const insertPayload = bookingInsertPayload(id, payload);
  let { error } = await supabase.from("booking_requests").insert(insertPayload);

  if (error?.code === "PGRST204") {
    console.error(
      "Booking request insert schema mismatch, retrying legacy insert:",
      error.message
    );
    const retry = await supabase
      .from("booking_requests")
      .insert(legacyBookingInsertPayload(insertPayload));
    error = retry.error;
  }

  if (error) {
    console.error("Booking request insert failed:", error);
    return NextResponse.json(
      { error: "Unable to save booking request." },
      { status: 500 }
    );
  }

  const stops = payload.stops ?? [];
  if (stops.length > 0) {
    const { error: stopsError } = await supabase.from("booking_stops").insert(
        stops.map((value, index) => ({
          booking_request_id: id,
          position: index + 1,
          value,
          place: payload.stopPlaces?.[index] ?? null
        }))
      );

    if (stopsError) {
      return NextResponse.json(
        { error: "Booking was saved, but stops could not be saved." },
        { status: 500 }
      );
    }
  }

  const emailResult = await sendReservationEmails({ bookingId: id, payload });
  if (emailResult.reasons.length > 0) {
    console.error("Reservation email issue:", emailResult.reasons.join(" | "));
  }

  return NextResponse.json(
    {
      id,
      emailSent: emailResult.receiptSent,
      adminEmailSent: emailResult.adminSent,
      reminderScheduled: emailResult.reminderScheduled
    },
    { status: 201 }
  );
}
