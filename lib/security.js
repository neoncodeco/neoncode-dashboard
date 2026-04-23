const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email || "").trim().toLowerCase());
}

export function sanitizeText(value, maxLength = 500) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function isSafeHttpUrl(url) {
  try {
    const parsed = new URL(String(url || "").trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function safeServerErrorResponse() {
  return Response.json({ ok: false, error: "Server error" }, { status: 500 });
}
