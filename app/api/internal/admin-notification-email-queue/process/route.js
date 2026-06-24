import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/apiGuard";
import {
  isValidQueueSecret,
  processAdminNotificationEmailQueueStep,
} from "@/lib/adminNotificationEmailQueue";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const secret = req.headers.get("x-queue-secret");
    if (!isValidQueueSecret(secret)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJsonBody(req);
    const queueId = String(body?.queueId || "").trim();
    if (!queueId) {
      return NextResponse.json({ ok: false, error: "queueId is required" }, { status: 400 });
    }

    const result = await processAdminNotificationEmailQueueStep(queueId);
    if (!result.ok) {
      return NextResponse.json(result, { status: result.error === "Queue not found" ? 404 : 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("ADMIN NOTIFICATION EMAIL QUEUE PROCESS ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
