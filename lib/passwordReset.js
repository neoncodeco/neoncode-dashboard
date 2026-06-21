import crypto from "crypto";
import {
  canResendOtp,
  generateOtpCode,
  getOtpExpiryDate,
  hashOtpCode,
  isOtpExpired,
  MAX_OTP_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
} from "@/lib/otpUtils";

const RESET_WINDOW_MS = 1000 * 60 * 30;
const RESET_SESSION_TTL_MS = 15 * 60 * 1000;
export const PASSWORD_RESET_MAX_REQUESTS = 5;

export { MAX_OTP_ATTEMPTS, OTP_RESEND_COOLDOWN_MS, canResendOtp, isOtpExpired };

export function createPasswordResetOtp() {
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = getOtpExpiryDate();
  return { code, codeHash, expiresAt };
}

export function hashPasswordResetOtp(code) {
  return hashOtpCode(code);
}

export function createPasswordResetSession() {
  const token = crypto.randomBytes(32).toString("hex");
  const sessionTokenHash = hashPasswordResetToken(token);
  const sessionExpiresAt = new Date(Date.now() + RESET_SESSION_TTL_MS);
  return { token, sessionTokenHash, sessionExpiresAt };
}

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
