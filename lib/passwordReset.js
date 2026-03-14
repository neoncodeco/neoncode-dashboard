import crypto from "crypto";

const RESET_WINDOW_MS = 1000 * 60 * 30;

export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_WINDOW_MS);

  return { token, tokenHash, expiresAt };
}

export function hashPasswordResetToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

export function isPasswordResetExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}
