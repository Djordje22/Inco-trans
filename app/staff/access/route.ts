import { NextResponse } from "next/server";
import { decryptStaffToken, hashJti, hashToken } from "@/lib/staff/token";
import { setStaffChallengeCookie } from "@/lib/staff/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  // Generic error — never reveal specifics
  const fail = () =>
    NextResponse.redirect(`${origin}/staff/login?error=invalid`);

  if (!token) return fail();

  // 1. Decrypt and validate token
  const payload = decryptStaffToken(token);
  if (!payload) return fail();

  // 2. Check DB record
  const supabase = getSupabaseAdminClient();
  if (!supabase) return fail();

  const jtiHash = hashJti(payload.jti);
  const tokenHash = hashToken(token);

  const { data: link } = await supabase
    .from("staff_access_links")
    .select("id, booking_request_id, revoked, used_at, expires_at")
    .eq("jti_hash", jtiHash)
    .eq("token_hash", tokenHash)
    .single();

  if (!link) return fail();
  if (link.revoked) return fail();
  if (new Date(link.expires_at) < new Date()) return fail();
  if (link.booking_request_id !== payload.bookingId) return fail();

  // 3. Mark as used
  await supabase
    .from("staff_access_links")
    .update({ used_at: new Date().toISOString() })
    .eq("id", link.id);

  // 4. Set challenge cookie and redirect (drops token from URL)
  setStaffChallengeCookie(payload.bookingId, payload.exp);

  const response = NextResponse.redirect(
    `${origin}/staff/login?booking=${payload.bookingId}`,
    { headers: { "Referrer-Policy": "no-referrer" } }
  );
  return response;
}
