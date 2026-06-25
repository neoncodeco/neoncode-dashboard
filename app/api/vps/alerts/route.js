import { getVpsAlerts } from "@/lib/vpsMonitoring";
import { readServerId, requireVpsAdmin, vpsError, vpsJson } from "@/lib/vpsApiGuard";

export async function GET(req) {
  try {
    const access = await requireVpsAdmin(req);
    if (!access.ok) return access.response;

    const { searchParams } = new URL(req.url);
    const serverId = readServerId(req);
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const alerts = await getVpsAlerts(access.db, { serverId: serverId || null, activeOnly });
    return vpsJson({ data: alerts });
  } catch (error) {
    console.error("VPS ALERTS ERROR:", error);
    return vpsError("Server error", 500);
  }
}
