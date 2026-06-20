const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare test keys — always pass; use for local dev only */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

export function isTurnstileEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() &&
      process.env.TURNSTILE_SECRET_KEY?.trim()
  );
}

/**
 * Verifies a Turnstile token with Cloudflare (server-side).
 * @param {string} token - Client token from the widget
 * @param {{ remoteip?: string }} [opts]
 * @returns {Promise<boolean>}
 */
export async function verifyTurnstileToken(token, opts = {}) {
  if (!isTurnstileEnabled()) {
    if (process.env.NODE_ENV === "production") {
      console.warn("Turnstile: keys not configured — skipping verification");
    }
    return true;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
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
