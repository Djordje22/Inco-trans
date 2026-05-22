/** Shared auth / profile input validation helpers. */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type PasswordIssue =
  | "too_short"
  | "no_uppercase"
  | "no_lowercase"
  | "no_digit"
  | "no_symbol";

const SYMBOL_RE = /[^A-Za-z0-9]/;

export function validatePassword(password: string): PasswordIssue[] {
  const issues: PasswordIssue[] = [];
  if (password.length < 12) issues.push("too_short");
  if (!/[A-Z]/.test(password)) issues.push("no_uppercase");
  if (!/[a-z]/.test(password)) issues.push("no_lowercase");
  if (!/[0-9]/.test(password)) issues.push("no_digit");
  if (!SYMBOL_RE.test(password)) issues.push("no_symbol");
  return issues;
}

export function isPasswordValid(password: string): boolean {
  return validatePassword(password).length === 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailValid(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function isPhoneValid(phone: string): boolean {
  // Accept digits, spaces, dashes, plus — at least 6 digits
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

export function isNameValid(name: string): boolean {
  return name.trim().length >= 1 && name.trim().length <= 100;
}
