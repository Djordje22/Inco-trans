import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  getStaffChallenge,
  setStaffSessionCookie,
  setStaffDashboardCookie
} from "@/lib/staff/session";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function logAttempt(
  ip: string,
  email: string | null,
  success: boolean
) {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return;
    await supabase.from("staff_login_attempts").insert({
      ip_address: ip,
      email,
      token_jti_hash: null,
      success
    });
  } catch {
    // Logging is best-effort; don't block login
  }
}

async function isRateLimited(ip: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("staff_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .eq("success", false)
      .gte("created_at", fiveMinutesAgo);
    return (count ?? 0) >= 5;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const fail = () =>
    NextResponse.json({ error: "Invalid credentials." }, { status: 401 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) return fail();

  const { email, password, bookingId } = body;

  // Validate credentials (constant-time comparison)
  const expectedEmail = process.env.STAFF_ACCESS_EMAIL ?? "";
  const expectedPassword = process.env.STAFF_ACCESS_PASSWORD ?? "";

  if (!expectedEmail || !expectedPassword) return fail();

  const emailMatch = constantTimeEqual(email.toLowerCase(), expectedEmail.toLowerCase());
  const passwordMatch = constantTimeEqual(password, expectedPassword);

  if (!emailMatch || !passwordMatch) {
    await logAttempt(ip, email, false);
    return fail();
  }

  // Two modes: per-booking (from email link) or dashboard (standalone login)
  if (bookingId) {
    const challenge = getStaffChallenge();
    if (!challenge || challenge.bookingId !== bookingId) {
      await logAttempt(ip, email, false);
      return fail();
    }
    setStaffSessionCookie(bookingId, challenge.exp);
    await logAttempt(ip, email, true);
    return NextResponse.json({ redirectTo: `/staff/bookings/${bookingId}` });
  }

  // Dashboard login: set dashboard-wide session cookie (12h)
  setStaffDashboardCookie();
  await logAttempt(ip, email, true);
  return NextResponse.json({ redirectTo: "/staff/dashboard" });
}
