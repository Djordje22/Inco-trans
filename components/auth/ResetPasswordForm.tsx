"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  validatePassword,
  isPasswordValid,
  type PasswordIssue
} from "@/lib/auth/validation";
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

export default function ResetPasswordForm({ locale, dict }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(dict.auth.genericError);
      setLoading(false);
      return;
    }

    window.location.href = routeMap.profile[locale];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        {loading ? "..." : dict.auth.setNewPassword}
      </button>
    </form>
  );
}
