import { subscribeVpsMetrics } from "@/lib/vpsEventBus";
import { verifyToken } from "@/lib/verifyToken";
import getDB from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function isAdminUser(req) {
  const decoded = await verifyToken(req);
  if (!decoded?.uid) return false;
  const { db } = await getDB();
  const user = await db.collection("users").findOne({ userId: decoded.uid });
  return user?.role === "admin";
}

export async function GET(req) {
  const allowed = await isAdminUser(req);
  if (!allowed) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("connected", { at: new Date().toISOString() });

      const unsubscribe = subscribeVpsMetrics((payload) => {
        send("metrics", payload);
      });

      const heartbeat = setInterval(() => {
        send("ping", { at: new Date().toISOString() });
      }, 15_000);

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      req.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
