"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeEmail } from "@/lib/auth/validation";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";
import { routeMap } from "@/lib/site-config";

type Props = {
  locale: Locale;
  dict: Dict;
};

export default function ForgotPasswordForm({ locale, dict }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      normalizeEmail(email),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(routeMap.resetPassword[locale])}`
      }
    );

    if (authError) {
      setError(dict.auth.genericError);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-white/80">{dict.auth.checkEmailReset}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm text-white/70 mb-1">
          {dict.auth.email}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="glass-input w-full"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-gold w-full justify-center"
      >
        {loading ? "..." : dict.auth.sendResetLink}
      </button>

      <p className="mt-4 text-center text-sm text-white/50">
        <Link
          href={routeMap.login[locale]}
          className="text-gold-400 hover:text-gold-300"
        >
          {dict.auth.login}
        </Link>
      </p>
    </form>
  );
}
