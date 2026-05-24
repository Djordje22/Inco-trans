import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    hasStaffEmail: !!process.env.STAFF_ACCESS_EMAIL,
    hasStaffPassword: !!process.env.STAFF_ACCESS_PASSWORD,
    hasSessionSecret: !!process.env.STAFF_SESSION_SECRET,
    hasTokenSecret: !!process.env.STAFF_ACCESS_TOKEN_SECRET,
    hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasAdminEmail: !!process.env.RESERVATION_ADMIN_EMAIL,
    staffEmailLength: (process.env.STAFF_ACCESS_EMAIL ?? "").length,
    staffPasswordLength: (process.env.STAFF_ACCESS_PASSWORD ?? "").length,
    emailFromValue: process.env.RESERVATION_EMAIL_FROM ?? "(not set)"
  });
}
