import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Adyen standard webhook notification handler.
 *
 * Adyen sends notifications to this endpoint when payment status changes.
 * Must always return "[accepted]" to acknowledge, even if processing fails
 * (otherwise Adyen retries indefinitely).
 *
 * See: https://docs.adyen.com/development-resources/webhooks/
 */

function verifyHmac(notificationItem: Record<string, any>, hmacKey: string): boolean {
  const additionalData = notificationItem.additionalData ?? {};
  const providedHmac = additionalData.hmacSignature;
  if (!providedHmac) return false;

  // Build the signing string in Adyen's expected order
  const amount = notificationItem.amount ?? {};
  const signingFields = [
    notificationItem.pspReference ?? "",
    notificationItem.originalReference ?? "",
    notificationItem.merchantAccountCode ?? "",
    notificationItem.merchantReference ?? "",
    String(amount.value ?? ""),
    amount.currency ?? "",
    notificationItem.eventCode ?? "",
    notificationItem.success ?? ""
  ];

  const signingString = signingFields.join(":");

  try {
    const keyBytes = Buffer.from(hmacKey, "hex");
    const computed = createHmac("sha256", keyBytes)
      .update(signingString, "utf8")
      .digest("base64");

    const computedBuf = Buffer.from(computed);
    const providedBuf = Buffer.from(providedHmac);
    if (computedBuf.length !== providedBuf.length) return false;
    return timingSafeEqual(computedBuf, providedBuf);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const accepted = () => NextResponse.json({ status: "[accepted]" });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return accepted();
  }

  const items = body?.notificationItems;
  if (!Array.isArray(items) || items.length === 0) {
    return accepted();
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    console.error("Adyen webhook: Supabase not configured");
    return accepted();
  }

  const hmacKey = process.env.ADYEN_WEBHOOK_HMAC_KEY;

  for (const wrapper of items) {
    const item = wrapper?.NotificationRequestItem;
    if (!item) continue;

    // Verify HMAC if configured
    if (hmacKey && !verifyHmac(item, hmacKey)) {
      console.error("Adyen webhook: HMAC verification failed for", item.pspReference);
      continue;
    }

    const eventCode: string = item.eventCode ?? "";
    const success: string = item.success ?? "";
    const merchantReference: string = item.merchantReference ?? "";
    const pspReference: string = item.pspReference ?? "";

    if (!merchantReference) continue;

    // Map Adyen event codes to our payment status
    if (eventCode === "AUTHORISATION") {
      if (success === "true") {
        // Payment successful
        const { error } = await supabase
          .from("booking_requests")
          .update({
            payment_status: "paid",
            payment_provider_ref: pspReference,
            paid_at: new Date().toISOString()
          })
          .eq("id", merchantReference)
          .eq("payment_provider", "adyen");

        if (error) {
          console.error("Adyen webhook: Failed to update booking", merchantReference, error);
        }
      } else {
        // Payment failed
        await supabase
          .from("booking_requests")
          .update({ payment_status: "failed" })
          .eq("id", merchantReference)
          .eq("payment_provider", "adyen");
      }
    }

    if (eventCode === "CANCELLATION" || eventCode === "CANCEL_OR_REFUND") {
      await supabase
        .from("booking_requests")
        .update({ payment_status: "cancelled" })
        .eq("id", merchantReference)
        .eq("payment_provider", "adyen");
    }

    if (eventCode === "EXPIRE") {
      await supabase
        .from("booking_requests")
        .update({ payment_status: "expired" })
        .eq("id", merchantReference)
        .eq("payment_provider", "adyen");
    }

    if (eventCode === "REFUND") {
      if (success === "true") {
        await supabase
          .from("booking_requests")
          .update({ payment_status: "cancelled" })
          .eq("id", merchantReference)
          .eq("payment_provider", "adyen");
      }
    }
  }

  // Always acknowledge
  return accepted();
}
