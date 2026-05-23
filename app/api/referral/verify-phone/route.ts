import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/supabase/auth-user";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizePhone(countryCode: string, phone: string): string {
  return (countryCode + phone).replace(/[\s\-()]/g, "");
}

function generateVerificationCode(): string {
  // 6-char uppercase alphanumeric
  return randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}

/** POST /api/referral/verify-phone — submit phone for WhatsApp verification */
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.phoneCountryCode || !body?.phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }

  // Find the referral where this user is the referred person
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, status")
    .eq("referred_id", user.id)
    .maybeSingle();

  if (!referral) {
    return NextResponse.json({ error: "No referral found for your account" }, { status: 400 });
  }

  if (referral.status === "qualified") {
    return NextResponse.json({ error: "already_verified" }, { status: 400 });
  }

  if (referral.status === "rejected") {
    return NextResponse.json({ error: "Referral was rejected" }, { status: 400 });
  }

  // Check if phone is already used globally
  const phoneNorm = normalizePhone(body.phoneCountryCode, body.phone);
  const crypto = await import("crypto");
  const phoneHash = crypto.createHash("sha256").update(phoneNorm).digest("hex");

  const { data: existingPhone } = await supabase
    .from("verified_phones")
    .select("id")
    .eq("phone_hash", phoneHash)
    .maybeSingle();

  if (existingPhone) {
    return NextResponse.json({ error: "phone_already_used" }, { status: 400 });
  }

  // Rate limit: max 3 pending requests per user
  const { count } = await supabase
    .from("phone_verification_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "Too many pending requests" }, { status: 429 });
  }

  const code = generateVerificationCode();

  const { error } = await supabase
    .from("phone_verification_requests")
    .insert({
      user_id: user.id,
      referral_id: referral.id,
      phone_country_code: body.phoneCountryCode,
      phone: body.phone,
      phone_normalized: phoneNorm,
      verification_code: code
    });

  if (error) {
    console.error("Phone verification insert failed:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }

  // Update referral status to pending_whatsapp_phone
  await supabase
    .from("referrals")
    .update({ status: "pending_whatsapp_phone", updated_at: new Date().toISOString() })
    .eq("id", referral.id);

  return NextResponse.json({ verificationCode: code, phone: phoneNorm });
}
