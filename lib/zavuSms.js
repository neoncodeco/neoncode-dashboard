import Zavudev from "@zavudev/sdk";

const zavu = new Zavudev({
  apiKey: process.env.ZAVUDEV_API_KEY,
});

export const sendZavuTemplateOtp = async ({ to, code }) => {
  try {
    // 🔴 ENV check
    if (!process.env.ZAVU_TEMPLATE_ID) {
      return {
        ok: false,
        error: "Template ID missing in env",
      };
    }

    const res = await zavu.messages.send({
      to: `+${to}`,
      messageType: "template",
      content: {
        templateId: process.env.ZAVU_TEMPLATE_ID,
        templateVariables: {
          "1": code,
        },
      },
    });

    console.log("TEMPLATE RESPONSE:", res);

    // 🔥 IMPORTANT: response validation
    if (!res || res.error) {
      return {
        ok: false,
        error: res?.error?.message || "Template send failed",
      };
    }

    return { ok: true };
  } catch (err) {
    console.error("TEMPLATE ERROR:", err);

    return {
      ok: false,
      error: err?.message || "Template send failed",
    };
  }
};

/**
 * Dashboard notices (tickets, payments, etc.) via Zavu — same stack as OTP.
 * Prefer ZAVU_ACTIVITY_TEMPLATE_ID (one body variable {{1}} = full notice text).
 * Falls back to ZAVU_TEMPLATE_ID if activity template is not set (template must accept text in {{1}}).
 */
export async function sendZavuDashboardNotice({ to, text }) {
  try {
    if (!process.env.ZAVUDEV_API_KEY?.trim()) {
      return { ok: false, error: "ZAVUDEV_API_KEY missing" };
    }

    const templateId = (process.env.ZAVU_ACTIVITY_TEMPLATE_ID || process.env.ZAVU_TEMPLATE_ID || "").trim();
    if (!templateId) {
      return {
        ok: false,
        error:
          "Set ZAVU_ACTIVITY_TEMPLATE_ID (recommended) or ZAVU_TEMPLATE_ID for Zavu dashboard notices.",
      };
    }

    const digits = String(to || "").replace(/\D/g, "");
    if (!digits) {
      return { ok: false, error: "Invalid destination" };
    }

    const safeText = String(text || "").trim().slice(0, 900);
    if (!safeText) {
      return { ok: false, error: "Empty notice text" };
    }

    const res = await zavu.messages.send({
      to: `+${digits}`,
      messageType: "template",
      content: {
        templateId,
        templateVariables: {
          "1": safeText,
        },
      },
    });

    if (!res || res.error) {
      return {
        ok: false,
        error: res?.error?.message || "Zavu notice send failed",
      };
    }

    return { ok: true };
  } catch (err) {
    console.error("ZAVU NOTICE ERROR:", err);
    return { ok: false, error: err?.message || "Zavu notice send failed" };
  }
}