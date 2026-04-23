import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsappOtp";
import { sendZavuDashboardNotice } from "@/lib/zavuSms";

const GRAPH_VERSION = "v22.0";

async function graphSendMessage(payload) {
  const accessToken = process.env.ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.PHONE_NUMBER_ID?.trim();
  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: "WhatsApp API not configured (ACCESS_TOKEN / PHONE_NUMBER_ID)." };
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
  }

  return { ok: true, data };
}

/**
 * Sends a utility message to WhatsApp. Prefer setting WHATSAPP_ACTIVITY_TEMPLATE_NAME (+ LANGUAGE)
 * with a single body placeholder for outbound notifications outside the 24h session window.
 */
export async function sendDashboardActivityWhatsApp({ to, body }) {
  const normalized = normalizeWhatsAppNumber(to);
  if (!isValidWhatsAppNumber(normalized)) {
    return { ok: false, error: "Invalid WhatsApp destination." };
  }

  const safeBody = String(body || "").trim().slice(0, 900);
  if (!safeBody) return { ok: false, error: "Empty body." };

  const activityTemplate = process.env.WHATSAPP_ACTIVITY_TEMPLATE_NAME?.trim();
  const lang = process.env.WHATSAPP_ACTIVITY_TEMPLATE_LANGUAGE?.trim() || "en_US";

  if (activityTemplate) {
    return graphSendMessage({
      messaging_product: "whatsapp",
      to: normalized,
      type: "template",
      template: {
        name: activityTemplate,
        language: { code: lang },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: safeBody }],
          },
        ],
      },
    });
  }

  return graphSendMessage({
    messaging_product: "whatsapp",
    to: normalized,
    type: "text",
    text: { preview_url: false, body: safeBody },
  });
}

/**
 * Sends a short activity line to the user's verified number (non-blocking for callers).
 * Tries Meta Cloud API first when configured; otherwise (or on Meta failure) uses Zavu
 * (ZAVU_ACTIVITY_TEMPLATE_ID or ZAVU_TEMPLATE_ID — see lib/zavuSms.js).
 */
export async function notifyUserDashboardActivity(db, userId, message) {
  try {
    const user = await db.collection("users").findOne(
      { userId: userId },
      { projection: { phoneVerification: 1, whatsappNumber: 1, phone: 1 } }
    );

    if (!user?.phoneVerification?.verified) {
      console.warn("[notifyUserDashboardActivity] skipped: phone/WhatsApp not verified", { userId });
      return;
    }

    const raw = user.whatsappNumber || user.phone || "";
    const to = normalizeWhatsAppNumber(raw);
    if (!isValidWhatsAppNumber(to)) {
      console.warn("[notifyUserDashboardActivity] skipped: invalid number on user", { userId, raw });
      return;
    }

    const metaConfigured = Boolean(process.env.ACCESS_TOKEN?.trim() && process.env.PHONE_NUMBER_ID?.trim());

    if (metaConfigured) {
      const metaResult = await sendDashboardActivityWhatsApp({ to, body: message });
      if (metaResult.ok) return;
      console.warn("[notifyUserDashboardActivity] Meta send failed, trying Zavu:", metaResult.error);
    }

    const zavuResult = await sendZavuDashboardNotice({ to, text: message });
    if (!zavuResult.ok) {
      console.warn("[notifyUserDashboardActivity] Zavu send failed:", zavuResult.error);
    }
  } catch (e) {
    console.warn("notifyUserDashboardActivity:", e);
  }
}
