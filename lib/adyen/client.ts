/**
 * Adyen Pay by Link integration.
 *
 * Environment variables:
 *   ADYEN_API_KEY          – API key from Adyen Customer Area
 *   ADYEN_MERCHANT_ACCOUNT – Merchant account name
 *   ADYEN_ENVIRONMENT      – "test" (default) or "live"
 *   ADYEN_LIVE_URL_PREFIX  – Required for live; the URL prefix from your Adyen account
 */

import { createHmac, timingSafeEqual } from "crypto";

type CreatePaymentLinkArgs = {
  /** Unique reference (booking ID) */
  reference: string;
  /** Amount in minor units, e.g. 3000 = €30.00 */
  amountValue: number;
  /** ISO 4217 currency code */
  currency?: string;
  /** Customer email for Adyen's shopper reference */
  shopperEmail?: string;
  /** Human-readable description shown on checkout */
  description: string;
  /** ISO 3166-1 alpha-2 country code, defaults to RS */
  countryCode?: string;
  /** Link expiry in ISO format. Defaults to 7 days from now. */
  expiresAt?: string;
  /** URL to redirect after payment */
  returnUrl?: string;
};

type PaymentLinkResult =
  | { ok: true; id: string; url: string; expiresAt: string }
  | { ok: false; error: string };

function getBaseUrl(): string {
  const env = process.env.ADYEN_ENVIRONMENT ?? "test";
  if (env === "live") {
    const prefix = process.env.ADYEN_LIVE_URL_PREFIX;
    if (!prefix) throw new Error("ADYEN_LIVE_URL_PREFIX is required for live environment");
    return `https://${prefix}-checkout-live.adyenpayments.com/checkout/v71`;
  }
  return "https://checkout-test.adyen.com/v71";
}

export async function createPaymentLink(args: CreatePaymentLinkArgs): Promise<PaymentLinkResult> {
  const apiKey = process.env.ADYEN_API_KEY;
  const merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT;

  if (!apiKey || !merchantAccount) {
    return { ok: false, error: "Adyen is not configured. Set ADYEN_API_KEY and ADYEN_MERCHANT_ACCOUNT." };
  }

  const expiresAt = args.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const body: Record<string, unknown> = {
    merchantAccount,
    reference: args.reference,
    amount: {
      value: args.amountValue,
      currency: args.currency ?? "EUR"
    },
    description: args.description,
    countryCode: args.countryCode ?? "RS",
    expiresAt,
    shopperLocale: "en-GB"
  };

  if (args.shopperEmail) {
    body.shopperEmail = args.shopperEmail;
    body.shopperReference = args.shopperEmail;
  }

  if (args.returnUrl) {
    body.returnUrl = args.returnUrl;
  }

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/paymentLinks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("Adyen paymentLinks error:", response.status, text);
      return { ok: false, error: `Adyen returned ${response.status}: ${text}` };
    }

    const data = await response.json();
    return {
      ok: true,
      id: data.id,
      url: data.url,
      expiresAt: data.expiresAt
    };
  } catch (err) {
    console.error("Adyen paymentLinks fetch error:", err);
    return { ok: false, error: "Failed to connect to Adyen." };
  }
}

/**
 * Verify an Adyen webhook HMAC signature.
 * See: https://docs.adyen.com/development-resources/webhooks/verify-hmac-signatures/
 */
export function verifyAdyenHmac(
  payload: Record<string, unknown>,
  hmacSignature: string,
  hmacKey: string
): boolean {
  // Adyen HMAC verification uses specific fields in a specific order
  // The signing string is built from NotificationRequestItem fields
  const item = payload as Record<string, string>;
  const signingFields = [
    item.pspReference ?? "",
    item.originalReference ?? "",
    item.merchantAccountCode ?? "",
    item.merchantReference ?? "",
    String(item.amount?.valueOf?.() ?? (item as any).amount?.value ?? ""),
    (item as any).amount?.currency ?? "",
    item.eventCode ?? "",
    item.success ?? ""
  ];

  const signingString = signingFields.join(":");

  try {
    const keyBytes = Buffer.from(hmacKey, "hex");
    const computed = createHmac("sha256", keyBytes)
      .update(signingString, "utf8")
      .digest("base64");

    const computedBuf = Buffer.from(computed);
    const providedBuf = Buffer.from(hmacSignature);
    if (computedBuf.length !== providedBuf.length) return false;
    return timingSafeEqual(computedBuf, providedBuf);
  } catch {
    return false;
  }
}
