import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-user";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LOYALTY_MILESTONE = 5;

/** GET /api/loyalty — returns the user's loyalty progress and codes */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }

  // Get user email from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  // Count completed bookings (by user_id OR email)
  let completedCount = 0;
  if (profile?.email) {
    const { count } = await supabase
      .from("booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .or(`user_id.eq.${user.id},email.eq.${profile.email}`);
    completedCount = count ?? 0;
  } else {
    const { count } = await supabase
      .from("booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .eq("user_id", user.id);
    completedCount = count ?? 0;
  }

  const progressInCycle = completedCount % LOYALTY_MILESTONE;
  const remaining = LOYALTY_MILESTONE - progressInCycle;

  // Fetch loyalty promo codes
  const { data: loyaltyCodes } = await supabase
    .from("promo_codes")
    .select("id, code, discount_percent, status, loyalty_milestone, redeemed_at, created_at")
    .eq("owner_id", user.id)
    .eq("promo_type", "loyalty_free_ride")
    .order("created_at", { ascending: false });

  return NextResponse.json({
    completedCount,
    progressInCycle,
    remaining: progressInCycle === 0 && completedCount > 0 ? 0 : remaining,
    milestone: LOYALTY_MILESTONE,
    loyaltyCodes: (loyaltyCodes ?? []).map((c: any) => ({
      id: c.id,
      code: c.code,
      status: c.status,
      milestone: c.loyalty_milestone,
      redeemedAt: c.redeemed_at,
      createdAt: c.created_at
    }))
  });
}
