import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-user";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LOYALTY_FREE_KM = 25;
const LOYALTY_OVERAGE_RATE = 1.15; // EUR per km

/** POST /api/promo/validate — validate a promo code for the current user */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = (body?.code ?? "").trim().toUpperCase();
  const service = body?.service ?? "";
  const distanceMeters = body?.distanceMeters ?? 0;
  const waitingHours = body?.waitingHours ?? 0;

  if (!code) {
    return NextResponse.json({ valid: false, error: "empty" });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ valid: false, error: "backend" });
  }

  const { data: promo } = await supabase
    .from("promo_codes")
    .select("id, code, owner_id, discount_percent, status, promo_type")
    .eq("code", code)
    .maybeSingle();

  if (!promo) {
    return NextResponse.json({ valid: false, error: "not_found" });
  }

  if (promo.status !== "active") {
    return NextResponse.json({ valid: false, error: "already_redeemed" });
  }

  // Promo code is owner-bound: check if the current user owns it
  const user = await getAuthUser();
  if (!user || user.id !== promo.owner_id) {
    return NextResponse.json({ valid: false, error: "not_yours" });
  }

  // --- Referral percent code ---
  if (promo.promo_type === "referral_percent" || !promo.promo_type) {
    return NextResponse.json({
      valid: true,
      promoId: promo.id,
      code: promo.code,
      promoType: "referral_percent",
      discountPercent: promo.discount_percent
    });
  }

  // --- Loyalty free ride code ---
  if (promo.promo_type === "loyalty_free_ride") {
    // Loyalty codes are not valid for chauffeur service
    if (service === "chauffeur") {
      return NextResponse.json({ valid: false, error: "not_for_chauffeur" });
    }

    const distanceKm = distanceMeters / 1000;
    const overageKm = Math.max(0, distanceKm - LOYALTY_FREE_KM);
    const overagePrice = Math.round(overageKm * LOYALTY_OVERAGE_RATE * 100) / 100;

    return NextResponse.json({
      valid: true,
      promoId: promo.id,
      code: promo.code,
      promoType: "loyalty_free_ride",
      discountPercent: 100,
      loyaltyFreeKm: LOYALTY_FREE_KM,
      loyaltyOverageKm: Math.round(overageKm * 10) / 10,
      loyaltyOverageRate: LOYALTY_OVERAGE_RATE,
      loyaltyOveragePrice: overagePrice
    });
  }

  return NextResponse.json({ valid: false, error: "unknown_type" });
}
