import { NextResponse } from "next/server";
import { getStaffDashboardSession } from "@/lib/staff/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendBookingConfirmationEmail } from "@/lib/email/booking-confirmation";

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
  if (!body?.bookingId || !body?.vehicleId) {
    return NextResponse.json({ error: "Missing bookingId or vehicleId." }, { status: 400 });
  }

  const { bookingId, vehicleId } = body;

  // Fetch the vehicle
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, name, slug, passengers, luggage")
    .eq("id", vehicleId)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  }

  // Update booking: assign vehicle and set status to confirmed
  const { error: updateError } = await supabase
    .from("booking_requests")
    .update({
      assigned_vehicle_id: vehicleId,
      status: "confirmed"
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("Booking confirm update failed:", updateError);
    return NextResponse.json({ error: "Failed to update booking." }, { status: 500 });
  }

  // Fetch the booking for the confirmation email
  const { data: booking } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  // Send confirmation email to the customer
  let emailSent = false;
  if (booking.email) {
    const result = await sendBookingConfirmationEmail({
      bookingId,
      booking,
      vehicleName: vehicle.name
    });
    emailSent = result.sent;
    if (!result.sent) {
      console.error("Confirmation email failed:", result.reason);
    }
  }

  return NextResponse.json({ ok: true, emailSent });
}
