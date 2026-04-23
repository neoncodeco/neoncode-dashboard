const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Turnstile token with Cloudflare (server-side).
 * @param {string} token - Client token from the widget
 * @param {{ remoteip?: string }} [opts]
 * @returns {Promise<boolean>}
 */
export async function verifyTurnstileToken(token, opts = {}) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("Turnstile: TURNSTILE_SECRET_KEY is not set");
      return false;
    }
    console.warn("Turnstile: TURNSTILE_SECRET_KEY missing; skipping verification (non-production)");
    return true;
  }

  const response = String(token || "").trim();
  if (!response) return false;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", response);
  const ip = String(opts.remoteip || "").trim();
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.success === true;
  } catch (e) {
    console.error("Turnstile siteverify error:", e);
    return false;
  }
}
