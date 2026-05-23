import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getStaffDashboardSession } from "@/lib/staff/session";

export const runtime = "nodejs";

function generatePromoCode(): string {
  return "REF-" + randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** GET /api/referral/admin — list pending phone verification requests */
export async function GET() {
  const session = getStaffDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }

  const { data: requests } = await supabase
    .from("phone_verification_requests")
    .select("id, user_id, referral_id, phone_country_code, phone, phone_normalized, verification_code, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!requests || requests.length === 0) {
    return NextResponse.json({ requests: [] });
  }

  // Enrich with user and referrer info
  const userIds = [...new Set(requests.map((r: any) => r.user_id))];
  const referralIds = [...new Set(requests.map((r: any) => r.referral_id))];

  const [{ data: profiles }, { data: referrals }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds),
    supabase.from("referrals").select("id, referrer_id").in("id", referralIds)
  ]);

  const referrerIds = [...new Set((referrals ?? []).map((r: any) => r.referrer_id))];
  const { data: referrerProfiles } = referrerIds.length > 0
    ? await supabase.from("profiles").select("id, first_name, last_name, email").in("id", referrerIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const referralMap = new Map((referrals ?? []).map((r: any) => [r.id, r]));
  const referrerMap = new Map((referrerProfiles ?? []).map((p: any) => [p.id, p]));

  // Check which phones are already verified
  const phoneHashes = await Promise.all(
    requests.map(async (r: any) => {
      const crypto = await import("crypto");
      return crypto.createHash("sha256").update(r.phone_normalized).digest("hex");
    })
  );

  const { data: existingPhones } = await supabase
    .from("verified_phones")
    .select("phone_hash")
    .in("phone_hash", phoneHashes);

  const usedPhoneHashes = new Set((existingPhones ?? []).map((p: any) => p.phone_hash));

  const enriched = await Promise.all(requests.map(async (r: any, i: number) => {
    const userProfile = profileMap.get(r.user_id) as any;
    const referral = referralMap.get(r.referral_id) as any;
    const referrerProfile = referral ? referrerMap.get(referral.referrer_id) as any : null;

    return {
      id: r.id,
      phone: r.phone_country_code + " " + r.phone,
      verificationCode: r.verification_code,
      userName: userProfile ? `${userProfile.first_name ?? ""} ${userProfile.last_name ?? ""}`.trim() || userProfile.email : "Unknown",
      userEmail: userProfile?.email,
      referrerName: referrerProfile ? `${referrerProfile.first_name ?? ""} ${referrerProfile.last_name ?? ""}`.trim() || referrerProfile.email : "Unknown",
      phoneAlreadyUsed: usedPhoneHashes.has(phoneHashes[i]),
      createdAt: r.created_at
    };
  }));

  return NextResponse.json({ requests: enriched });
}

/** POST /api/referral/admin — approve or reject a phone verification */
export async function POST(request: Request) {
  const session = getStaffDashboardSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.requestId || !["approve", "reject"].includes(body?.action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }

  // Fetch the verification request
  const { data: verReq } = await supabase
    .from("phone_verification_requests")
    .select("id, user_id, referral_id, phone_normalized, status")
    .eq("id", body.requestId)
    .single();

  if (!verReq || verReq.status !== "pending") {
    return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
  }

  if (body.action === "reject") {
    await supabase
      .from("phone_verification_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", verReq.id);

    await supabase
      .from("referrals")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", verReq.referral_id);

    return NextResponse.json({ ok: true, action: "rejected" });
  }

  // Approve flow
  const crypto = await import("crypto");
  const phoneHash = crypto.createHash("sha256").update(verReq.phone_normalized).digest("hex");

  // Check phone not already used
  const { data: existing } = await supabase
    .from("verified_phones")
    .select("id")
    .eq("phone_hash", phoneHash)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "phone_already_used" }, { status: 400 });
  }

  // Fetch referral to get referrer_id
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referrer_id, referred_id")
    .eq("id", verReq.referral_id)
    .single();

  if (!referral) {
    return NextResponse.json({ error: "Referral not found" }, { status: 404 });
  }

  // 1. Mark phone as verified
  await supabase.from("verified_phones").insert({
    phone_hash: phoneHash,
    user_id: verReq.user_id
  });

  // 2. Update verification request
  await supabase
    .from("phone_verification_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", verReq.id);

  // 3. Update referral to qualified
  await supabase
    .from("referrals")
    .update({ status: "qualified", updated_at: new Date().toISOString() })
    .eq("id", referral.id);

  // 4. Generate promo codes for both users
  const referrerCode = generatePromoCode();
  const referredCode = generatePromoCode();

  await supabase.from("promo_codes").insert([
    {
      code: referrerCode,
      owner_id: referral.referrer_id,
      referral_id: referral.id,
      discount_percent: 5,
      status: "active"
    },
    {
      code: referredCode,
      owner_id: referral.referred_id,
      referral_id: referral.id,
      discount_percent: 5,
      status: "active"
    }
  ]);

  // 5. Send notification emails to both users
  try {
    const [{ data: referrerProfile }, { data: referredProfile }] = await Promise.all([
      supabase.from("profiles").select("email, first_name").eq("id", referral.referrer_id).single(),
      supabase.from("profiles").select("email, first_name").eq("id", referral.referred_id).single()
    ]);

    const { sendReferralPromoEmail } = await import("@/lib/email/referral-promo");
    await Promise.all([
      referrerProfile?.email && sendReferralPromoEmail({
        to: referrerProfile.email,
        name: referrerProfile.first_name ?? "",
        promoCode: referrerCode,
        isReferrer: true
      }),
      referredProfile?.email && sendReferralPromoEmail({
        to: referredProfile.email,
        name: referredProfile.first_name ?? "",
        promoCode: referredCode,
        isReferrer: false
      })
    ]);
  } catch (e) {
    console.error("Failed to send referral promo emails:", e);
  }

  return NextResponse.json({ ok: true, action: "approved" });
}
