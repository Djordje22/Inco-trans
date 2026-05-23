"use client";

import { useEffect, useState } from "react";
import { Check, X, Phone, AlertTriangle } from "lucide-react";

type VerificationRequest = {
  id: string;
  phone: string;
  verificationCode: string;
  userName: string;
  userEmail: string;
  referrerName: string;
  phoneAlreadyUsed: boolean;
  createdAt: string;
};

export default function ReferralVerifications() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/referral/admin");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    setProcessing(requestId);
    try {
      const res = await fetch("/api/referral/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });

      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        const data = await res.json();
        alert(data.error || "Error");
      }
    } catch {
      alert("Network error");
    }
    setProcessing(null);
  };

  if (loading) return null;
  if (requests.length === 0) {
    return (
      <div className="text-sm text-white/40 text-center py-4">
        Nema zahteva za potvrdu.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold-400 shrink-0" />
                <span className="text-sm font-medium text-white/90">{r.phone}</span>
              </div>
              <div className="text-xs text-white/50 space-y-0.5">
                <p>Korisnik: <span className="text-white/70">{r.userName}</span> ({r.userEmail})</p>
                <p>Pozvan od: <span className="text-white/70">{r.referrerName}</span></p>
                <p>Verifikacioni kod: <span className="font-mono text-gold-400">{r.verificationCode}</span></p>
                <p className="text-white/30">
                  {new Date(r.createdAt).toLocaleString("sr-Latn-RS", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>

              {r.phoneAlreadyUsed && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Ovaj broj je već korišćen za referral nagradu.
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleAction(r.id, "approve")}
                disabled={processing === r.id || r.phoneAlreadyUsed}
                className="rounded-lg bg-green-500/20 px-3 py-1.5 text-sm text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAction(r.id, "reject")}
                disabled={processing === r.id}
                className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
