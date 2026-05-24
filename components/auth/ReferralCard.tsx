"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Gift, Clock, MessageCircle, ExternalLink } from "lucide-react";
import CountryCodeSelect from "@/components/CountryCodeSelect";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";
import { siteConfig } from "@/lib/site-config";

type Props = {
  locale: Locale;
  dict: Dict;
};

type ReferralData = {
  referralCode: string | null;
  referrals: { id: string; status: string; referredName: string; createdAt: string }[];
  myReferral: { id: string; status: string } | null;
  phoneVerification: { id: string; status: string; verificationCode: string; phone: string } | null;
  promoCodes: { id: string; code: string; discountPercent: number; status: string; redeemedAt: string | null; createdAt: string }[];
};

const WHATSAPP_NUMBER = "381628643221";

export default function ReferralCard({ locale, dict }: Props) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState("+381");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!data?.referralCode) return null;

  const rd = dict.referral;
  const origin = typeof window !== "undefined" ? window.location.origin : siteConfig.url;
  const signupPath = locale === "sr" ? "/registracija" : locale === "ru" ? "/ru/signup" : "/en/signup";
  const referralLink = `${origin}${signupPath}?ref=${data.referralCode}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyPhone = async () => {
    setSubmitError("");
    if (!phone.trim()) return;
    setSubmitting(true);

    const res = await fetch("/api/referral/verify-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneCountryCode, phone: phone.trim() })
    });

    const result = await res.json();
    if (!res.ok) {
      if (result.error === "phone_already_used") {
        setSubmitError(rd.phoneAlreadyUsed);
      } else if (result.error === "already_verified") {
        setSubmitError(rd.alreadyVerified);
      } else {
        setSubmitError(result.error || "Error");
      }
      setSubmitting(false);
      return;
    }

    // Refresh data and open WhatsApp
    const refreshed = await fetch("/api/referral").then((r) => r.json());
    setData(refreshed);
    setSubmitting(false);

    // Open WhatsApp with pre-filled message
    const msg = encodeURIComponent(
      `Referral potvrda za Inco Trans.\nKod: ${result.verificationCode}\nMoj broj: ${result.phone}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  const showPhoneVerification = data.myReferral && data.myReferral.status === "pending_whatsapp_phone" && !data.phoneVerification;
  const pendingVerification = data.phoneVerification?.status === "pending";
  const approvedVerification = data.phoneVerification?.status === "approved" || data.myReferral?.status === "qualified";

  return (
    <div className="space-y-6">
      {/* Referral Link Card */}
      <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-5 w-5 text-gold-400" />
          <h3 className="font-display text-lg text-white">{rd.cardTitle}</h3>
        </div>
        <p className="text-sm text-white/60 mb-4">{rd.cardDescription}</p>

        <label className="block text-xs text-white/50 mb-1">{rd.yourLink}</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="glass-input flex-1 text-xs !text-white/70"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {/* Referral list (people you've invited) */}
        {data.referrals.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs text-white/50 uppercase tracking-wider mb-2">
              {rd.cardTitle}
            </h4>
            <div className="space-y-1.5">
              {data.referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{r.referredName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === "qualified"
                      ? "bg-green-500/20 text-green-300"
                      : "bg-yellow-500/20 text-yellow-300"
                  }`}>
                    {r.status === "qualified" ? rd.referralQualified : rd.referralPending}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* WhatsApp Phone Verification (for referred users) */}
      {showPhoneVerification && (
        <section className="rounded-xl border border-gold-400/20 bg-gold-400/[0.04] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-5 w-5 text-gold-400" />
            <h3 className="font-display text-lg text-white">{rd.verifyPhoneTitle}</h3>
          </div>
          <p className="text-sm text-white/60 mb-4">{rd.verifyPhoneDescription}</p>

          <div className="flex items-stretch gap-2 mb-3">
            <CountryCodeSelect
              ariaLabel="Country code"
              value={phoneCountryCode}
              onChange={setPhoneCountryCode}
            />
            <input
              type="tel"
              placeholder={rd.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass-input flex-1"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-400 mb-3">{submitError}</p>
          )}

          <button
            type="button"
            onClick={handleVerifyPhone}
            disabled={submitting || !phone.trim()}
            className="btn-gold w-full justify-center inline-flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {submitting ? "..." : rd.sendWhatsApp}
          </button>
        </section>
      )}

      {/* Pending verification status */}
      {pendingVerification && (
        <section className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.04] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <p className="text-sm text-yellow-300">{rd.verificationPending}</p>
          </div>
        </section>
      )}

      {/* Approved verification */}
      {approvedVerification && data.myReferral && (
        <section className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-400" />
            <p className="text-sm text-green-300">{rd.verificationApproved}</p>
          </div>
        </section>
      )}

      {/* Promo Codes */}
      {data.promoCodes.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <h3 className="font-display text-lg text-white mb-3">{rd.promoCodes}</h3>
          <div className="space-y-2">
            {data.promoCodes.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                <div>
                  <span className="font-mono text-sm text-white/90 tracking-wider">{p.code}</span>
                  <span className="ml-2 text-xs text-white/50">-{p.discountPercent}%</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === "active"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-white/10 text-white/40"
                }`}>
                  {p.status === "active" ? rd.promoActive : rd.promoRedeemed}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.promoCodes.length === 0 && !showPhoneVerification && !pendingVerification && !approvedVerification && (
        <p className="text-sm text-white/40 text-center">{rd.noPromos}</p>
      )}
    </div>
  );
}
