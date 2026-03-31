import crypto from "crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtpCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

export function getOtpExpiryDate() {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function isOtpExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}

export function canResendOtp(requestedAt) {
  if (!requestedAt) return true;
  return Date.now() - new Date(requestedAt).getTime() >= OTP_RESEND_COOLDOWN_MS;
}