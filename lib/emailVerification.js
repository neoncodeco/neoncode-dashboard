import crypto from "crypto";

export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 5 * 60 * 1000;
export const EMAIL_VERIFICATION_MAX_REQUESTS = 5;

export function createEmailVerificationToken() {
  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = hashEmailVerificationToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashEmailVerificationToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

export function isEmailVerificationExpired(expiresAt) {
  if (!expiresAt) return true;
  const date = new Date(expiresAt);
  return Number.isNaN(date.getTime()) || date.getTime() <= Date.now();
}

export function buildEmailVerificationUrl(req, token) {
  const envBase =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    "";
  const origin = envBase || new URL(req.url).origin;
  return `${origin.replace(/\/+$/, "")}/api/auth/email-verification/verify?token=${encodeURIComponent(token)}`;
}
