import { getLatestMetrics } from "@/lib/vpsMonitoring";
import { readServerId, requireVpsAdmin, vpsError, vpsJson } from "@/lib/vpsApiGuard";

export async function GET(req) {
  try {
    const access = await requireVpsAdmin(req);
    if (!access.ok) return access.response;

    const serverId = readServerId(req);
    const metrics = await getLatestMetrics(access.db, serverId || null);

    return vpsJson({ data: metrics });
  } catch (error) {
    console.error("VPS LIVE ERROR:", error);
    return vpsError("Server error", 500);
  }
}
