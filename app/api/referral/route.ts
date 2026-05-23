import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-user";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** GET /api/referral — returns the user's referral code, referral list, and promo codes */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }

  // Fetch profile (referral code)
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code, first_name, last_name")
    .eq("id", user.id)
    .single();

  // Fetch referrals where this user is the referrer
  const { data: referralsAsReferrer } = await supabase
    .from("referrals")
    .select("id, referred_id, status, created_at")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch referral where this user is the referred (at most one)
  const { data: referralAsReferred } = await supabase
    .from("referrals")
    .select("id, referrer_id, status, created_at")
    .eq("referred_id", user.id)
    .maybeSingle();

  // Fetch phone verification status for this user
  const { data: phoneVerification } = await supabase
    .from("phone_verification_requests")
    .select("id, status, verification_code, phone_country_code, phone, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch promo codes
  const { data: promoCodes } = await supabase
    .from("promo_codes")
    .select("id, code, discount_percent, status, redeemed_at, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  // Get referred users' names for the referrer's list
  const referrerList = [];
  if (referralsAsReferrer && referralsAsReferrer.length > 0) {
    const referredIds = referralsAsReferrer.map((r: any) => r.referred_id);
    const { data: referredProfiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", referredIds);

    const profileMap = new Map((referredProfiles ?? []).map((p: any) => [p.id, p]));
    for (const r of referralsAsReferrer) {
      const p = profileMap.get((r as any).referred_id) as any;
      referrerList.push({
        id: r.id,
        status: r.status,
        referredName: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email : "Unknown",
        createdAt: r.created_at
      });
    }
  }

  return NextResponse.json({
    referralCode: profile?.referral_code ?? null,
    referrals: referrerList,
    myReferral: referralAsReferred
      ? { id: referralAsReferred.id, status: referralAsReferred.status }
      : null,
    phoneVerification: phoneVerification
      ? { id: phoneVerification.id, status: phoneVerification.status, verificationCode: phoneVerification.verification_code, phone: phoneVerification.phone_country_code + phoneVerification.phone }
      : null,
    promoCodes: (promoCodes ?? []).map((p: any) => ({
      id: p.id,
      code: p.code,
      discountPercent: p.discount_percent,
      status: p.status,
      redeemedAt: p.redeemed_at,
      createdAt: p.created_at
    }))
  });
}
