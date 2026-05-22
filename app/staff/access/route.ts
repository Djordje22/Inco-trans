import { NextResponse } from "next/server";
import { decryptStaffToken, hashJti, hashToken } from "@/lib/staff/token";
import { buildStaffDashboardCookie } from "@/lib/staff/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  const fail = () =>
    NextResponse.redirect(`${origin}/staff/login?error=invalid`);

  if (!token) return fail();

  const payload = decryptStaffToken(token);
  if (!payload) return fail();

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

  await supabase
    .from("staff_access_links")
    .update({ used_at: new Date().toISOString() })
    .eq("id", link.id);

  // Valid token - set dashboard session cookie on the redirect response
  const cookie = buildStaffDashboardCookie();
  const response = NextResponse.redirect(`${origin}/staff/dashboard`);
  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}
