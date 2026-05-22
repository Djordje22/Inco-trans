import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "staff_session";
const DASHBOARD_COOKIE = "staff_dashboard";
const CHALLENGE_COOKIE = "staff_challenge";

function getSessionSecret(): string {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret) throw new Error("STAFF_SESSION_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

type StaffSession = {
  bookingId: string;
  exp: number;
};

export function setStaffChallengeCookie(bookingId: string, tokenExp: number) {
  const payload = JSON.stringify({ bookingId, exp: tokenExp });
  const sig = sign(payload);
  const value = `${Buffer.from(payload).toString("base64url")}.${sig}`;

  cookies().set(CHALLENGE_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/staff",
    maxAge: Math.max(0, tokenExp - Math.floor(Date.now() / 1000))
  });
}

export function getStaffChallenge(): { bookingId: string; exp: number } | null {
  const raw = cookies().get(CHALLENGE_COOKIE)?.value;
  if (!raw) return null;

  const [encodedPayload, sig] = raw.split(".");
  if (!encodedPayload || !sig) return null;

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expected = sign(payload);

  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const parsed = JSON.parse(payload);
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;

  return parsed;
}

export function setStaffSessionCookie(bookingId: string, exp: number) {
  const payload = JSON.stringify({ bookingId, exp } satisfies StaffSession);
  const sig = sign(payload);
  const value = `${Buffer.from(payload).toString("base64url")}.${sig}`;

  cookies().set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/staff",
    maxAge: Math.max(0, exp - Math.floor(Date.now() / 1000))
  });

  // Clear the challenge cookie after successful login
  cookies().delete(CHALLENGE_COOKIE);
}

export function getStaffSession(): StaffSession | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [encodedPayload, sig] = raw.split(".");
  if (!encodedPayload || !sig) return null;

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expected = sign(payload);

  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const parsed: StaffSession = JSON.parse(payload);
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;

  return parsed;
}

// ---------------------------------------------------------------------------
// Dashboard-wide session (not scoped to a single booking)
// ---------------------------------------------------------------------------

const DASHBOARD_EXPIRY_HOURS = 12;

type DashboardSession = {
  role: "staff";
  exp: number;
};

export function setStaffDashboardCookie() {
  const exp = Math.floor(Date.now() / 1000) + DASHBOARD_EXPIRY_HOURS * 3600;
  const payload = JSON.stringify({ role: "staff", exp } satisfies DashboardSession);
  const sig = sign(payload);
  const value = `${Buffer.from(payload).toString("base64url")}.${sig}`;

  cookies().set(DASHBOARD_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/staff",
    maxAge: DASHBOARD_EXPIRY_HOURS * 3600
  });
}

export function getStaffDashboardSession(): DashboardSession | null {
  const raw = cookies().get(DASHBOARD_COOKIE)?.value;
  if (!raw) return null;

  const [encodedPayload, sig] = raw.split(".");
  if (!encodedPayload || !sig) return null;

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const expected = sign(payload);

  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const parsed: DashboardSession = JSON.parse(payload);
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;

  return parsed;
}
