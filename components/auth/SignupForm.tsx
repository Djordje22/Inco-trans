"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  normalizeEmail,
  validatePassword,
  isPasswordValid,
  type PasswordIssue
} from "@/lib/auth/validation";
import GoogleLoginButton from "./GoogleLoginButton";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";
import { routeMap } from "@/lib/site-config";

type Props = {
  locale: Locale;
  dict: Dict;
};

const issueLabel = (issue: PasswordIssue, dict: Dict): string => {
  const map: Record<PasswordIssue, string> = {
    too_short: dict.auth.passwordTooShort,
    no_uppercase: dict.auth.passwordNoUppercase,
    no_lowercase: dict.auth.passwordNoLowercase,
    no_digit: dict.auth.passwordNoDigit,
    no_symbol: dict.auth.passwordNoSymbol
  };
  return map[issue];
};

export default function SignupForm({ locale, dict }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  // Capture ?ref= param from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
  }, []);

  const passwordIssues = password ? validatePassword(password) : [];
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid(password)) {
      setError(dict.auth.passwordRequirements);
      return;
    }
    if (!passwordsMatch) {
      setError(dict.auth.passwordsMustMatch);
      return;
    }

    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          ...(referralCode ? { referral_code: referralCode } : {})
        }
      }
    });

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
        <p className="text-sm text-white/80">{dict.auth.checkEmailConfirmation}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm text-white/70 mb-1">
            {dict.auth.firstName}
          </label>
          <input
            id="firstName"
            type="text"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="glass-input w-full"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm text-white/70 mb-1">
            {dict.auth.lastName}
          </label>
          <input
            id="lastName"
            type="text"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="glass-input w-full"
          />
        </div>
      </div>

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
        <label htmlFor="password" className="block text-sm text-white/70 mb-1">
          {dict.auth.password}
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="glass-input w-full"
        />
        {password && passwordIssues.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {passwordIssues.map((issue) => (
              <li key={issue} className="text-xs text-red-400">
                {issueLabel(issue, dict)}
              </li>
            ))}
          </ul>
        )}
        {password && passwordIssues.length === 0 && (
          <p className="mt-1 text-xs text-green-400">&#10003;</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm text-white/70 mb-1">
          {dict.auth.confirmPassword}
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="glass-input w-full"
        />
        {confirmPassword && !passwordsMatch && (
          <p className="mt-1 text-xs text-red-400">{dict.auth.passwordsMustMatch}</p>
        )}
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
        {loading ? "..." : dict.auth.createAccount}
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
        {dict.auth.alreadyHaveAccount}{" "}
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
