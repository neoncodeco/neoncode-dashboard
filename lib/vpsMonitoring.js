import { publishVpsMetrics } from "@/lib/vpsEventBus";
import {
  VPS_ALERT_THRESHOLDS,
  VPS_COLLECTIONS,
  VPS_ONLINE_TIMEOUT_MS,
} from "@/lib/vpsCollections";

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function pickPercent(metrics, keys, fallback = 0) {
  for (const key of keys) {
    const value = toNumber(metrics?.[key], NaN);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function normalizeServerId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 64);
}

function normalizePayload(body) {
  const serverId = normalizeServerId(body.serverId || body.hostname);
  if (!serverId) return null;

  const now = new Date();
  const timestamp = body.timestamp ? new Date(body.timestamp) : now;
  const receivedAt = Number.isNaN(timestamp.getTime()) ? now : timestamp;

  return {
    serverId,
    receivedAt,
    hostname: String(body.hostname || body.system?.hostname || serverId),
    provider: String(body.provider || "Contabo"),
    publicIp: String(body.publicIp || body.system?.publicIp || ""),
    cpu: body.cpu || {},
    memory: body.memory || {},
    storage: body.storage || {},
    network: body.network || {},
    system: body.system || {},
    pm2: Array.isArray(body.pm2) ? body.pm2 : [],
    processes: Array.isArray(body.processes) ? body.processes.slice(0, 10) : [],
    diskIo: body.diskIo || {},
    health: body.health || {},
  };
}

function buildHistoryPoint(snapshot) {
  return {
    serverId: snapshot.serverId,
    timestamp: snapshot.receivedAt,
    cpu: pickPercent(snapshot.cpu, ["usage", "usagePercent"]),
    memory: pickPercent(snapshot.memory, ["usedPercent", "usagePercent"]),
    disk: pickPercent(snapshot.storage, ["usedPercent", "usagePercent"]),
    network: {
      rxSec: toNumber(snapshot.network?.rxSec ?? snapshot.network?.downloadSpeed),
      txSec: toNumber(snapshot.network?.txSec ?? snapshot.network?.uploadSpeed),
    },
    loadAvg: snapshot.cpu?.loadAvg || snapshot.cpu?.load || [],
  };
}

async function upsertServer(db, snapshot) {
  const now = new Date();
  await db.collection(VPS_COLLECTIONS.servers).updateOne(
    { serverId: snapshot.serverId },
    {
      $set: {
        serverId: snapshot.serverId,
        hostname: snapshot.hostname,
        provider: snapshot.provider,
        publicIp: snapshot.publicIp,
        lastSeenAt: snapshot.receivedAt,
        online: true,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );
}

async function saveLatestMetrics(db, snapshot) {
  await db.collection(VPS_COLLECTIONS.latestMetrics).updateOne(
    { serverId: snapshot.serverId },
    {
      $set: {
        ...snapshot,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

async function saveHistoryMetrics(db, snapshot) {
  const point = buildHistoryPoint(snapshot);
  await db.collection(VPS_COLLECTIONS.serverMetrics).insertOne(point);
}

async function saveProcessLog(db, snapshot) {
  if (!snapshot.processes?.length) return;
  await db.collection(VPS_COLLECTIONS.processLogs).insertOne({
    serverId: snapshot.serverId,
    timestamp: snapshot.receivedAt,
    processes: snapshot.processes,
  });
}

async function logSystemEvent(db, { serverId, level = "info", message, meta = {} }) {
  await db.collection(VPS_COLLECTIONS.systemLogs).insertOne({
    serverId: serverId || "",
    level,
    message,
    meta,
    createdAt: new Date(),
  });
}

async function resolveAlert(db, serverId, type) {
  await db.collection(VPS_COLLECTIONS.alerts).updateMany(
    {
      serverId,
      type,
      active: true,
    },
    {
      $set: {
        active: false,
        resolvedAt: new Date(),
      },
    }
  );
}

async function raiseAlert(db, serverId, alert) {
  const existing = await db.collection(VPS_COLLECTIONS.alerts).findOne({
    serverId,
    type: alert.type,
    active: true,
  });
  if (existing) {
    await db.collection(VPS_COLLECTIONS.alerts).updateOne(
      { _id: existing._id },
      {
        $set: {
          message: alert.message,
          value: alert.value,
          threshold: alert.threshold,
          severity: alert.severity,
          updatedAt: new Date(),
        },
      }
    );
    return;
  }

  await db.collection(VPS_COLLECTIONS.alerts).insertOne({
    serverId,
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    value: alert.value,
    threshold: alert.threshold,
    active: true,
    createdAt: new Date(),
    resolvedAt: null,
  });
}

async function evaluateAlerts(db, snapshot) {
  const { serverId } = snapshot;
  const cpu = pickPercent(snapshot.cpu, ["usage", "usagePercent"]);
  const memory = pickPercent(snapshot.memory, ["usedPercent", "usagePercent"]);
  const disk = pickPercent(snapshot.storage, ["usedPercent", "usagePercent"]);

  if (cpu >= VPS_ALERT_THRESHOLDS.cpu) {
    await raiseAlert(db, serverId, {
      type: "high_cpu",
      severity: cpu >= 95 ? "critical" : "warning",
      message: `CPU usage is ${cpu.toFixed(1)}%`,
      value: cpu,
      threshold: VPS_ALERT_THRESHOLDS.cpu,
    });
  } else {
    await resolveAlert(db, serverId, "high_cpu");
  }

  if (memory >= VPS_ALERT_THRESHOLDS.memory) {
    await raiseAlert(db, serverId, {
      type: "high_ram",
      severity: memory >= 95 ? "critical" : "warning",
      message: `RAM usage is ${memory.toFixed(1)}%`,
      value: memory,
      threshold: VPS_ALERT_THRESHOLDS.memory,
    });
  } else {
    await resolveAlert(db, serverId, "high_ram");
  }

  if (disk >= VPS_ALERT_THRESHOLDS.disk) {
    await raiseAlert(db, serverId, {
      type: "high_disk",
      severity: disk >= 95 ? "critical" : "warning",
      message: `Disk usage is ${disk.toFixed(1)}%`,
      value: disk,
      threshold: VPS_ALERT_THRESHOLDS.disk,
    });
  } else {
    await resolveAlert(db, serverId, "high_disk");
  }

  const offlinePm2 = (snapshot.pm2 || []).filter(
    (app) => String(app.status || "").toLowerCase() !== "online"
  );
  if (offlinePm2.length) {
    await raiseAlert(db, serverId, {
      type: "pm2_down",
      severity: "critical",
      message: `${offlinePm2.length} PM2 app(s) not online`,
      value: offlinePm2.length,
      threshold: 0,
    });
  } else if ((snapshot.pm2 || []).length) {
    await resolveAlert(db, serverId, "pm2_down");
  }
}

export async function ingestVpsMetrics(db, body) {
  const snapshot = normalizePayload(body);
  if (!snapshot) {
    return { ok: false, error: "Invalid payload: serverId is required" };
  }

  await upsertServer(db, snapshot);
  await saveLatestMetrics(db, snapshot);
  await saveHistoryMetrics(db, snapshot);
  await saveProcessLog(db, snapshot);
  await evaluateAlerts(db, snapshot);

  publishVpsMetrics({
    serverId: snapshot.serverId,
    receivedAt: snapshot.receivedAt.toISOString(),
  });

  return { ok: true, serverId: snapshot.serverId, receivedAt: snapshot.receivedAt };
}

export async function markStaleServersOffline(db) {
  const cutoff = new Date(Date.now() - VPS_ONLINE_TIMEOUT_MS);
  await db.collection(VPS_COLLECTIONS.servers).updateMany(
    { lastSeenAt: { $lt: cutoff }, online: true },
    { $set: { online: false, updatedAt: new Date() } }
  );
}

export async function listVpsServers(db) {
  await markStaleServersOffline(db);
  return db
    .collection(VPS_COLLECTIONS.servers)
    .find({})
    .sort({ hostname: 1 })
    .toArray();
}

export async function getLatestMetrics(db, serverId) {
  await markStaleServersOffline(db);
  const query = serverId ? { serverId: normalizeServerId(serverId) } : {};
  const items = await db.collection(VPS_COLLECTIONS.latestMetrics).find(query).toArray();
  const servers = await listVpsServers(db);
  const serverMap = new Map(servers.map((item) => [item.serverId, item]));

  return items.map((item) => ({
    ...item,
    server: serverMap.get(item.serverId) || null,
    online: Boolean(serverMap.get(item.serverId)?.online),
  }));
}

function resolveHistoryRange(range) {
  const now = Date.now();
  switch (String(range || "24h").toLowerCase()) {
    case "1h":
      return { from: new Date(now - 60 * 60 * 1000), bucketMs: 5_000 };
    case "7d":
      return { from: new Date(now - 7 * 24 * 60 * 60 * 1000), bucketMs: 30 * 60 * 1000 };
    case "30d":
      return { from: new Date(now - 30 * 24 * 60 * 60 * 1000), bucketMs: 2 * 60 * 60 * 1000 };
    case "24h":
    default:
      return { from: new Date(now - 24 * 60 * 60 * 1000), bucketMs: 5 * 60 * 1000 };
  }
}

function bucketHistory(points, bucketMs) {
  if (!points.length) return [];
  const buckets = new Map();

  for (const point of points) {
    const ts = new Date(point.timestamp).getTime();
    const key = Math.floor(ts / bucketMs) * bucketMs;
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, { ...point, timestamp: new Date(key), count: 1 });
      continue;
    }
    existing.cpu = (existing.cpu * existing.count + point.cpu) / (existing.count + 1);
    existing.memory = (existing.memory * existing.count + point.memory) / (existing.count + 1);
    existing.disk = (existing.disk * existing.count + point.disk) / (existing.count + 1);
    existing.network = {
      rxSec: (existing.network.rxSec * existing.count + point.network.rxSec) / (existing.count + 1),
      txSec: (existing.network.txSec * existing.count + point.network.txSec) / (existing.count + 1),
    };
    existing.count += 1;
  }

  return Array.from(buckets.values())
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(({ count, ...rest }) => rest);
}

export async function getVpsHistory(db, { serverId, range = "24h" }) {
  const normalizedId = normalizeServerId(serverId);
  if (!normalizedId) return { points: [], range };

  const { from, bucketMs } = resolveHistoryRange(range);
  const points = await db
    .collection(VPS_COLLECTIONS.serverMetrics)
    .find({
      serverId: normalizedId,
      timestamp: { $gte: from },
    })
    .sort({ timestamp: 1 })
    .limit(50_000)
    .toArray();

  return {
    serverId: normalizedId,
    range,
    from,
    to: new Date(),
    points: bucketHistory(points, bucketMs),
  };
}

export async function getVpsAlerts(db, { serverId, activeOnly = true } = {}) {
  const query = {};
  if (serverId) query.serverId = normalizeServerId(serverId);
  if (activeOnly) query.active = true;

  return db
    .collection(VPS_COLLECTIONS.alerts)
    .find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
}

export async function getVpsProcesses(db, serverId) {
  const latest = await db.collection(VPS_COLLECTIONS.latestMetrics).findOne({
    serverId: normalizeServerId(serverId),
  });
  return latest?.processes || [];
}

export async function getVpsPm2(db, serverId) {
  const latest = await db.collection(VPS_COLLECTIONS.latestMetrics).findOne({
    serverId: normalizeServerId(serverId),
  });
  return latest?.pm2 || [];
}

export async function getVpsNetwork(db, serverId) {
  const latest = await db.collection(VPS_COLLECTIONS.latestMetrics).findOne({
    serverId: normalizeServerId(serverId),
  });
  return latest?.network || null;
}

export async function getVpsStorage(db, serverId) {
  const latest = await db.collection(VPS_COLLECTIONS.latestMetrics).findOne({
    serverId: normalizeServerId(serverId),
  });
  return latest?.storage || null;
}

export async function getVpsSystem(db, serverId) {
  const latest = await db.collection(VPS_COLLECTIONS.latestMetrics).findOne({
    serverId: normalizeServerId(serverId),
  });
  return {
    system: latest?.system || null,
    health: latest?.health || null,
    hostname: latest?.hostname || "",
    publicIp: latest?.publicIp || "",
    receivedAt: latest?.receivedAt || null,
  };
}

export { logSystemEvent, normalizeServerId };
