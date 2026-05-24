import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete("staff_dashboard");
  cookieStore.delete("staff_session");
  cookieStore.delete("staff_challenge");
  return NextResponse.json({ ok: true });
}
