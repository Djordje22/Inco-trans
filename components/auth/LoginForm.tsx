"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeEmail } from "@/lib/auth/validation";
import GoogleLoginButton from "./GoogleLoginButton";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";
import { routeMap } from "@/lib/site-config";

type Props = {
  locale: Locale;
  dict: Dict;
};

export default function LoginForm({ locale, dict }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password
    });

    if (authError) {
      if (authError.message.includes("Email not confirmed")) {
        setError(dict.auth.emailNotConfirmed);
      } else {
        setError(dict.auth.invalidCredentials);
      }
      setLoading(false);
      return;
    }

    window.location.href = routeMap.home[locale];
  };

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

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="text-sm text-white/70">
            {dict.auth.password}
          </label>
          <Link
            href={routeMap.forgotPassword[locale]}
            className="text-xs text-gold-400 hover:text-gold-300"
          >
            {dict.auth.forgotPassword}
          </Link>
        </div>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {loading ? "..." : dict.auth.login}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-ink-900 px-3 text-white/50">
            {dict.auth.orContinueWith}
          </span>
        </div>
      </div>

      <GoogleLoginButton label={dict.auth.googleLogin} locale={locale} />

      <p className="mt-4 text-center text-sm text-white/50">
        {dict.auth.dontHaveAccount}{" "}
        <Link
          href={routeMap.signup[locale]}
          className="text-gold-400 hover:text-gold-300"
        >
          {dict.auth.signup}
        </Link>
      </p>

      <p className="mt-6 text-center text-xs text-white/30">
        {dict.auth.staffLoginPrompt}{" "}
        <Link
          href="/staff/login"
          className="text-white/50 hover:text-white/70 underline underline-offset-2"
        >
          {dict.auth.staffLoginLink}
        </Link>
      </p>
    </form>
  );
}
