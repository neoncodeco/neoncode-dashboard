const ingestRateMap = new Map();
const RATE_WINDOW_MS = 2_000;

export function verifyVpsIngestToken(req) {
  const secret = String(process.env.VPS_INGEST_SECRET || "").trim();
  if (!secret) return { ok: false, error: "VPS ingest is not configured" };

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || token !== secret) {
    return { ok: false, error: "Invalid ingest token" };
  }

  return { ok: true };
}

export function validateAllowedServerId(serverId) {
  const allowlist = String(process.env.VPS_ALLOWED_SERVER_IDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!allowlist.length) return { ok: true };
  if (!allowlist.includes(serverId)) {
    return { ok: false, error: "Server ID is not allowed" };
  }
  return { ok: true };
}

export function checkIngestRateLimit(serverId) {
  const key = String(serverId || "unknown");
  const now = Date.now();
  const last = ingestRateMap.get(key) || 0;
  if (now - last < RATE_WINDOW_MS) {
    return { ok: false, error: "Rate limit exceeded" };
  }
  ingestRateMap.set(key, now);
  if (ingestRateMap.size > 500) {
    for (const [id, ts] of ingestRateMap) {
      if (now - ts > 60_000) ingestRateMap.delete(id);
    }
  }
  return { ok: true };
}
