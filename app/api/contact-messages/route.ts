import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { validateContactMessagePayload } from "@/lib/backend/payloads";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { ContactMessagePayload } from "@/lib/backend/payloads";

export const runtime = "nodejs";

function messageWithExtras(payload: ContactMessagePayload) {
  const lines = [payload.message.trim()].filter(Boolean);

  if (payload.companyVatNumber || payload.companyAddress) {
    lines.push(
      "Company information:",
      payload.companyVatNumber ? `VAT/PIB: ${payload.companyVatNumber}` : "",
      payload.companyAddress ? `Adresa kompanije: ${payload.companyAddress}` : ""
    );
  }

  if (payload.bookingForOther) {
    lines.push(
      "Rezervacija za drugu osobu:",
      `Ime putnika: ${payload.passengerName ?? ""}`,
      `Telefon putnika: ${[payload.passengerPhoneCountryCode, payload.passengerPhone]
        .filter(Boolean)
        .join(" ")}`
    );
  }

  return lines.filter(Boolean).join("\n");
}

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
      message: messageWithExtras(payload),
      status: "new"
    });

  if (error) {
    console.error("Contact message insert failed:", error);
    return NextResponse.json(
      { error: "Unable to save contact message." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id }, { status: 201 });
}
