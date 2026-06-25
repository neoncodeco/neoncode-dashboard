import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody } from "@/lib/apiGuard";
import {
  checkIngestRateLimit,
  validateAllowedServerId,
  verifyVpsIngestToken,
} from "@/lib/vpsIngestAuth";
import { ingestVpsMetrics, logSystemEvent } from "@/lib/vpsMonitoring";

export async function POST(req) {
  try {
    const auth = verifyVpsIngestToken(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
    }

    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const serverId = String(body.serverId || body.hostname || "").trim();
    if (!serverId) {
      return NextResponse.json({ ok: false, error: "serverId is required" }, { status: 400 });
    }

    const allowed = validateAllowedServerId(serverId);
    if (!allowed.ok) {
      return NextResponse.json({ ok: false, error: allowed.error }, { status: 403 });
    }

    const rate = checkIngestRateLimit(serverId);
    if (!rate.ok) {
      return NextResponse.json({ ok: false, error: rate.error }, { status: 429 });
    }

    const { db } = await getDB();
    const result = await ingestVpsMetrics(db, body);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Metrics ingested",
      serverId: result.serverId,
      receivedAt: result.receivedAt,
    });
  } catch (error) {
    console.error("VPS INGEST ERROR:", error);
    try {
      const { db } = await getDB();
      await logSystemEvent(db, {
        level: "error",
        message: "Ingest failed",
        meta: { error: error.message },
      });
    } catch {
      // ignore secondary logging errors
    }
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
