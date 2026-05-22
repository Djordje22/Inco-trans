import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const TOKEN_EXPIRY_HOURS = 12;

function getTokenSecret(): Buffer {
  const secret = process.env.STAFF_ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("STAFF_ACCESS_TOKEN_SECRET is not set");
  return createHash("sha256").update(secret).digest();
}

export type StaffTokenPayload = {
  bookingId: string;
  jti: string;
  purpose: "staff_access";
  exp: number;
};

/**
 * Generate an encrypted AES-GCM staff access token.
 * Returns { token, jtiHash, tokenHash } for DB storage.
 */
export function generateStaffToken(bookingId: string) {
  const jti = randomBytes(16).toString("hex");
  const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_HOURS * 3600;

  const payload: StaffTokenPayload = {
    bookingId,
    jti,
    purpose: "staff_access",
    exp
  };

  const key = getTokenSecret();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Token format: base64url(iv + authTag + ciphertext)
  const token = Buffer.concat([iv, authTag, encrypted]).toString("base64url");

  const jtiHash = createHash("sha256").update(jti).digest("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  return { token, jtiHash, tokenHash, expiresAt: new Date(exp * 1000) };
}

/**
 * Decrypt and validate a staff access token.
 * Returns the payload if valid, or null if invalid/expired.
 */
export function decryptStaffToken(token: string): StaffTokenPayload | null {
  try {
    const key = getTokenSecret();
    const raw = Buffer.from(token, "base64url");

    if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) return null;

    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const payload: StaffTokenPayload = JSON.parse(decrypted.toString("utf8"));

    if (payload.purpose !== "staff_access") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function hashJti(jti: string): string {
  return createHash("sha256").update(jti).digest("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
