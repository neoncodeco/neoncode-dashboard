const INGEST_URL = String(process.env.VPS_INGEST_URL || "").trim();
const INGEST_SECRET = String(process.env.VPS_INGEST_SECRET || "").trim();
const SERVER_ID = String(process.env.VPS_SERVER_ID || "").trim();
const INTERVAL_MS = Number(process.env.VPS_INTERVAL_MS || 5000);
const PUBLIC_IP = String(process.env.VPS_PUBLIC_IP || "").trim();

export function getAgentConfig() {
  return {
    ingestUrl: INGEST_URL,
    ingestSecret: INGEST_SECRET,
    serverId: SERVER_ID,
    intervalMs: Number.isFinite(INTERVAL_MS) && INTERVAL_MS >= 2000 ? INTERVAL_MS : 5000,
    publicIp: PUBLIC_IP,
  };
}

export function validateAgentConfig(config) {
  const missing = [];
  if (!config.ingestUrl) missing.push("VPS_INGEST_URL");
  if (!config.ingestSecret) missing.push("VPS_INGEST_SECRET");
  if (!config.serverId) missing.push("VPS_SERVER_ID");
  return missing;
}

export async function postMetrics(payload) {
  const config = getAgentConfig();
  const response = await fetch(config.ingestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.ingestSecret}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || `Ingest failed (${response.status})`);
  }
  return json;
}
