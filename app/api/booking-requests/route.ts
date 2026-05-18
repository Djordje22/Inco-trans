import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { validateBookingRequestPayload } from "@/lib/backend/payloads";
import { sendReservationEmails } from "@/lib/email/reservation-receipt";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
  const { error } = await supabase
    .from("booking_requests")
    .insert({
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
      message: payload.message || null,
      terms_accepted: payload.termsAccepted ?? false,
      status: "new"
    });

  if (error) {
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
      adminEmailSent: emailResult.adminSent
    },
    { status: 201 }
  );
}
