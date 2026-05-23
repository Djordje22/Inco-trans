import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateBookingRequestPayload } from "@/lib/backend/payloads";
import { sendReservationEmails } from "@/lib/email/reservation-receipt";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { generateStaffToken } from "@/lib/staff/token";
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

  if (payload.companyVatNumber || payload.companyAddress) {
    lines.push(
      "Company information:",
      payload.companyVatNumber ? `VAT/PIB: ${payload.companyVatNumber}` : "",
      payload.companyAddress ? `Adresa kompanije: ${payload.companyAddress}` : ""
    );
  }

  if (payload.service === "chauffeur") {
    lines.push(
      "Šofer servis:",
      `Do datum i vreme: ${payload.dropoffDateTime ?? ""}`,
      `Trajanje: ${payload.chauffeurDurationHours ?? ""}h`
    );
  }

  if (payload.promoCode && (payload.promoDiscountPercent ?? 0) > 0) {
    lines.push(
      "Promo kod:",
      `Kod: ${payload.promoCode}`,
      `Popust: ${payload.promoDiscountPercent}%`
    );
  }

  return lines.filter(Boolean).join("\n");
}

function bookingInsertPayload(id: string, payload: BookingRequestPayload, userId: string | null) {
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
    full_name: payload.fullName,
    email: payload.email || null,
    phone_country_code: payload.phoneCountryCode || null,
    phone: payload.phone,
    company_name: payload.companyName || null,
    company_vat_number: payload.companyVatNumber || null,
    company_address: payload.companyAddress || null,
    preferred_communication: payload.preferredCommunication || null,
    payment_method: payload.paymentMethod || "cash",
    pickup_place: payload.pickupPlace ?? null,
    destination_place: payload.destinationPlace ?? null,
    route_distance_meters: payload.priceEstimate?.distanceMeters ?? null,
    route_duration_seconds: payload.priceEstimate?.durationSeconds ?? null,
    price_estimate: payload.priceEstimate ?? null,
    message: messageWithExtras(payload) || null,
    terms_accepted: payload.termsAccepted ?? false,
    user_id: userId,
    promo_code_id: payload.promoId || null,
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
    promo_code_id,
    ...legacyPayload
  } = payload;
  void wifi_requested;
  void pickup_place;
  void destination_place;
  void route_distance_meters;
  void route_duration_seconds;
  void price_estimate;
  void promo_code_id;
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

  // Resolve authenticated user – always link booking to account if logged in
  let userId: string | null = null;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const cookieStore = cookies();
    const userClient = createServerClient(url, anonKey!, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        }
      }
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // If auth check fails, proceed without linking
  }

  // Server-side promo code re-validation before insert
  if (payload.promoId) {
    const { data: promo } = await supabase
      .from("promo_codes")
      .select("id, owner_id, status, promo_type")
      .eq("id", payload.promoId)
      .eq("status", "active")
      .maybeSingle();

    if (!promo || (userId && promo.owner_id !== userId)) {
      // Invalid or not owned — strip promo from payload
      payload.promoId = undefined;
      payload.promoCode = undefined;
      payload.promoDiscountPercent = undefined;
    } else if (promo.promo_type === "loyalty_free_ride" && payload.service === "chauffeur") {
      // Loyalty code not valid for chauffeur
      payload.promoId = undefined;
      payload.promoCode = undefined;
      payload.promoDiscountPercent = undefined;
    }
  }

  const insertPayload = bookingInsertPayload(id, payload, userId);
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

  // Redeem promo code on successful booking insert
  if (payload.promoId) {
    await supabase
      .from("promo_codes")
      .update({
        status: "redeemed",
        redeemed_at: new Date().toISOString(),
        booking_request_id: id
      })
      .eq("id", payload.promoId)
      .eq("status", "active");
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

  // Generate staff access token for admin email
  let staffAccessUrl: string | undefined;
  try {
    if (process.env.STAFF_ACCESS_TOKEN_SECRET) {
      const { token, jtiHash, tokenHash, expiresAt } = generateStaffToken(id);
      await supabase.from("staff_access_links").insert({
        booking_request_id: id,
        token_hash: tokenHash,
        jti_hash: jtiHash,
        expires_at: expiresAt.toISOString()
      });
      const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      staffAccessUrl = `${origin}/staff/access?token=${token}`;
    }
  } catch (e) {
    console.error("Staff token generation failed:", e);
  }

  const emailResult = await sendReservationEmails({ bookingId: id, payload, staffAccessUrl });
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
