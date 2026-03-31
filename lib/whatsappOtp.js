import crypto from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export function normalizeWhatsAppNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  if (digits.startsWith("1") && digits.length === 10) return `880${digits}`;

  return digits;
}

export function isValidWhatsAppNumber(value) {
  return /^8801\d{9}$/.test(value);
}

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

export function maskWhatsAppNumber(value) {
  if (!value || value.length < 6) return value;
  return `${value.slice(0, 5)}*****${value.slice(-2)}`;
}

export async function sendWhatsAppOtpTemplate({ to, code }) {
  const accessToken = process.env.ACCESS_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";

  if (!accessToken || !phoneNumberId || !templateName) {
    return {
      ok: false,
      error: "WhatsApp OTP config missing. Set ACCESS_TOKEN, PHONE_NUMBER_ID and WHATSAPP_TEMPLATE_NAME.",
    };
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: templateLanguage,
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: code,
              },
            ],
          },
        ],
      },
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      error: payload?.error?.message || "Failed to send WhatsApp OTP.",
    };
  }

  return { ok: true, payload };
}

export {
  MAX_OTP_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
};
