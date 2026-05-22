import { NextResponse } from "next/server";
import { getStaffDashboardSession } from "@/lib/staff/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { createPaymentLink } from "@/lib/adyen/client";
import { sendPaymentLinkEmail } from "@/lib/email/payment-link";
import type { Locale } from "@/lib/site-config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = getStaffDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.bookingId || !body?.amount) {
    return NextResponse.json({ error: "Missing bookingId or amount." }, { status: 400 });
  }

  const { bookingId, amount } = body;
  const currency = body.currency ?? "EUR";

  // amount is in EUR (e.g. 30 for €30), convert to minor units (cents)
  const amountMinor = Math.round(amount * 100);
  if (amountMinor <= 0) {
    return NextResponse.json({ error: "Amount must be positive." }, { status: 400 });
  }

  // Fetch booking
  const { data: booking } = await supabase
    .from("booking_requests")
    .select("*, vehicles:assigned_vehicle_id(name)")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (!booking.email) {
    return NextResponse.json({ error: "Booking has no customer email." }, { status: 400 });
  }

  // Only allow payment links for confirmed bookings
  if (booking.status !== "confirmed") {
    return NextResponse.json(
      { error: "Booking must be confirmed before sending a payment link." },
      { status: 400 }
    );
  }

  // Don't allow re-sending if already paid
  if (booking.payment_status === "paid") {
    return NextResponse.json({ error: "Booking is already paid." }, { status: 400 });
  }

  const locale = (booking.locale as Locale) || "en";
  const vehicleName = (booking as any).vehicles?.name ?? "—";
  const route = `${booking.pickup} → ${booking.destination}`;

  // Build description for Adyen checkout
  const description = `Inco Trans: ${route}`;

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://inco-trans.netlify.app";

  // Create Adyen payment link
  const linkResult = await createPaymentLink({
    reference: bookingId,
    amountValue: amountMinor,
    currency,
    shopperEmail: booking.email,
    description,
    returnUrl: `${origin}/${locale === "sr" ? "istorija" : locale === "ru" ? "ru/history" : "en/history"}`
  });

  if (!linkResult.ok) {
    console.error("Adyen payment link creation failed:", linkResult.error);
    return NextResponse.json({ error: linkResult.error }, { status: 502 });
  }

  // Store payment info in the booking
  const { error: updateError } = await supabase
    .from("booking_requests")
    .update({
      payment_provider: "adyen",
      payment_provider_ref: linkResult.id,
      payment_link_url: linkResult.url,
      payment_status: "pending",
      payment_amount: amountMinor,
      payment_currency: currency
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("Payment link update failed:", updateError);
    return NextResponse.json({ error: "Failed to save payment link." }, { status: 500 });
  }

  // Send payment link email to customer
  const emailResult = await sendPaymentLinkEmail({
    bookingId,
    customerEmail: booking.email,
    customerName: booking.full_name,
    locale,
    paymentUrl: linkResult.url,
    amount: amountMinor,
    currency,
    service: booking.service,
    pickup: booking.pickup,
    destination: booking.destination,
    pickupAt: booking.pickup_at,
    vehicleName
  });

  if (!emailResult.sent) {
    console.error("Payment link email failed:", emailResult);
  }

  return NextResponse.json({
    ok: true,
    paymentLinkUrl: linkResult.url,
    emailSent: emailResult.sent
  });
}
