import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { validateContactMessagePayload } from "@/lib/backend/payloads";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = validateContactMessagePayload(await request.json().catch(() => null));

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Backend is not configured. Add Supabase environment variables." },
      { status: 503 }
    );
  }

  const payload = parsed.value;
  const id = randomUUID();
  const { error } = await supabase
    .from("contact_messages")
    .insert({
      id,
      locale: payload.locale,
      source: payload.source ?? "contact_page",
      full_name: payload.fullName,
      email: payload.email || null,
      phone_country_code: payload.phoneCountryCode || null,
      phone: payload.phone || null,
      preferred_communication: payload.preferredCommunication || null,
      company_name: payload.companyName || null,
      message: payload.message,
      status: "new"
    });

  if (error) {
    return NextResponse.json(
      { error: "Unable to save contact message." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id }, { status: 201 });
}
