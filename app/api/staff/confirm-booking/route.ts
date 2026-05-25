import { NextResponse } from "next/server";
import { getStaffDashboardSession } from "@/lib/staff/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendBookingConfirmationEmail } from "@/lib/email/booking-confirmation";
import { createPaymentLink } from "@/lib/adyen/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = getStaffDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Sistem nije podešen." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.bookingId || !body?.vehicleId) {
    return NextResponse.json({ error: "Nedostaje ID rezervacije ili ID vozila." }, { status: 400 });
  }

  const { bookingId, vehicleId, finalPrice } = body;

  // Fetch the vehicle
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, name, slug, passengers, luggage")
    .eq("id", vehicleId)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Vozilo nije pronađeno." }, { status: 404 });
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    assigned_vehicle_id: vehicleId,
    status: "confirmed"
  };

  // If admin set a final price, update the price_estimate
  if (finalPrice && finalPrice > 0) {
    const { data: current } = await supabase
      .from("booking_requests")
      .select("price_estimate")
      .eq("id", bookingId)
      .single();

    const existingEstimate = (current?.price_estimate as Record<string, unknown>) ?? {};
    updatePayload.price_estimate = {
      ...existingEstimate,
      totalPrice: finalPrice,
      currency: (existingEstimate.currency as string) ?? "EUR"
    };
  }

  // Update booking: assign vehicle, set status, and optionally update price
  const { error: updateError } = await supabase
    .from("booking_requests")
    .update(updatePayload)
    .eq("id", bookingId);

  if (updateError) {
    console.error("Booking confirm update failed:", updateError);
    return NextResponse.json({ error: "Ažuriranje rezervacije nije uspelo." }, { status: 500 });
  }

  // Fetch the updated booking
  const { data: booking } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Rezervacija nije pronađena." }, { status: 404 });
  }

  // For card payments, create an Adyen payment link
  let paymentLinkUrl: string | null = null;
  let paymentLinkError: string | null = null;

  if (booking.payment_method === "card" && booking.email) {
    const price = finalPrice && finalPrice > 0
      ? finalPrice
      : (booking.price_estimate as any)?.totalPrice ?? 0;

    if (price > 0) {
      const amountInCents = Math.round(price * 100);
      const currency = "EUR";
      const locale = booking.locale || "en";
      const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://inco-trans.com";

      const linkResult = await createPaymentLink({
        reference: bookingId,
        amountValue: amountInCents,
        currency,
        shopperEmail: booking.email,
        description: `Inco Trans: ${booking.pickup} → ${booking.destination}`,
        returnUrl: `${origin}/${locale === "sr" ? "istorija" : locale === "ru" ? "ru/history" : "en/history"}`
      });

      if (linkResult.ok) {
        paymentLinkUrl = linkResult.url;

        await supabase
          .from("booking_requests")
          .update({
            payment_provider: "adyen",
            payment_provider_ref: linkResult.id,
            payment_link_url: linkResult.url,
            payment_status: "pending",
            payment_amount: amountInCents,
            payment_currency: currency
          })
          .eq("id", bookingId);
      } else {
        paymentLinkError = linkResult.error;
        console.error("Adyen payment link creation failed:", linkResult.error);
      }
    } else {
      paymentLinkError = "Cena nije postavljena.";
    }
  }

  // Send confirmation email (with payment link for card payments)
  let emailSent = false;
  if (booking.email) {
    const result = await sendBookingConfirmationEmail({
      bookingId,
      booking,
      vehicleName: vehicle.name,
      paymentUrl: paymentLinkUrl ?? undefined
    });
    emailSent = result.sent;
    if (!result.sent) {
      console.error("Confirmation email failed:", result.reason);
    }
  }

  return NextResponse.json({ ok: true, emailSent, paymentLinkUrl, paymentLinkError });
}
