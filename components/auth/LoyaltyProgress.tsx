"use client";

import { useEffect, useState } from "react";
import { Trophy, Gift } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";

type Props = {
  locale: Locale;
  dict: Dict;
};

type LoyaltyData = {
  completedCount: number;
  progressInCycle: number;
  remaining: number;
  milestone: number;
  loyaltyCodes: {
    id: string;
    code: string;
    status: string;
    milestone: number;
    redeemedAt: string | null;
    createdAt: string;
  }[];
};

export default function LoyaltyProgress({ locale, dict }: Props) {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/loyalty")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const ld = dict.loyalty;
  const steps = Array.from({ length: data.milestone }, (_, i) => i + 1);
  const filledSteps = data.progressInCycle === 0 && data.completedCount > 0
    ? data.milestone
    : data.progressInCycle;
  const activeCodes = data.loyaltyCodes.filter((c) => c.status === "active");
  const redeemedCodes = data.loyaltyCodes.filter((c) => c.status === "redeemed");

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-5 w-5 text-gold-400" />
        <h3 className="font-display text-lg text-white">{ld.title}</h3>
      </div>
      <p className="text-sm text-white/60 mb-5">{ld.description}</p>

      {/* Progress steps */}
      <div className="mb-4">
        <div className="flex items-center gap-1 mb-2">
          {steps.map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded-full transition-colors ${
                step <= filledSteps
                  ? "bg-gold-400"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-white/40">
          <span>{ld.completedRides.replace("{count}", String(data.completedCount))}</span>
          <span>
            {data.remaining === 0
              ? ld.rewardReady
              : ld.nextReward.replace("{remaining}", String(data.remaining))}
          </span>
        </div>
      </div>

      {/* Active loyalty codes */}
      {activeCodes.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5 text-gold-400" />
            {ld.freeRideCode}
          </h4>
          <div className="space-y-2">
            {activeCodes.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-gold-400/10 border border-gold-400/20 px-4 py-3">
                <span className="font-mono text-sm text-gold-300 tracking-wider">{c.code}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">
                  {dict.referral.promoActive}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redeemed loyalty codes */}
      {redeemedCodes.length > 0 && (
        <div className="mt-3">
          <div className="space-y-1.5">
            {redeemedCodes.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2.5">
                <span className="font-mono text-xs text-white/40 tracking-wider">{c.code}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40">
                  {dict.referral.promoRedeemed}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
