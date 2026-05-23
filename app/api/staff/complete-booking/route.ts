import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getStaffDashboardSession } from "@/lib/staff/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LOYALTY_MILESTONE = 5;

function generateLoyaltyCode(): string {
  return "LOYAL-" + randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

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
  if (!body?.bookingId) {
    return NextResponse.json({ error: "Nedostaje ID rezervacije." }, { status: 400 });
  }

  // Fetch the booking
  const { data: booking } = await supabase
    .from("booking_requests")
    .select("id, status, user_id, email")
    .eq("id", body.bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Rezervacija nije pronađena." }, { status: 404 });
  }

  if (booking.status === "completed") {
    return NextResponse.json({ error: "already_completed" }, { status: 400 });
  }

  // Mark as completed
  const { error: updateError } = await supabase
    .from("booking_requests")
    .update({ status: "completed" })
    .eq("id", booking.id);

  if (updateError) {
    console.error("Complete booking update failed:", updateError);
    return NextResponse.json({ error: "Ažuriranje rezervacije nije uspelo." }, { status: 500 });
  }

  // --- Loyalty code generation ---
  let loyaltyCodeGenerated: string | null = null;

  // Resolve user: prefer user_id, fallback to email match
  let userId = booking.user_id;
  if (!userId && booking.email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", booking.email)
      .maybeSingle();
    if (profile) userId = profile.id;
  }

  if (userId) {
    // Count all completed bookings for this user (by user_id OR email)
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    let completedCount = 0;
    if (userProfile?.email) {
      const { count } = await supabase
        .from("booking_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .or(`user_id.eq.${userId},email.eq.${userProfile.email}`);
      completedCount = count ?? 0;
    } else {
      const { count } = await supabase
        .from("booking_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .eq("user_id", userId);
      completedCount = count ?? 0;
    }

    // Check if this count hits a milestone (5, 10, 15, ...)
    if (completedCount > 0 && completedCount % LOYALTY_MILESTONE === 0) {
      const milestone = completedCount;

      // Check if reward already exists for this milestone
      const { data: existingReward } = await supabase
        .from("promo_codes")
        .select("id")
        .eq("owner_id", userId)
        .eq("promo_type", "loyalty_free_ride")
        .eq("loyalty_milestone", milestone)
        .maybeSingle();

      if (!existingReward) {
        const code = generateLoyaltyCode();
        const { error: insertError } = await supabase
          .from("promo_codes")
          .insert({
            code,
            owner_id: userId,
            promo_type: "loyalty_free_ride",
            loyalty_milestone: milestone,
            discount_percent: 100,
            status: "active"
          });

        if (!insertError) {
          loyaltyCodeGenerated = code;

          // Send email notification
          try {
            const { sendLoyaltyCodeEmail } = await import("@/lib/email/loyalty-code");
            const email = userProfile?.email || booking.email;
            if (email) {
              await sendLoyaltyCodeEmail({ to: email, promoCode: code, milestone });
            }
          } catch (e) {
            console.error("Loyalty email failed:", e);
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, loyaltyCodeGenerated });
}
