import { getVpsPm2 } from "@/lib/vpsMonitoring";
import { readServerId, requireVpsAdmin, vpsError, vpsJson } from "@/lib/vpsApiGuard";

export async function GET(req) {
  try {
    const access = await requireVpsAdmin(req);
    if (!access.ok) return access.response;

    const serverId = readServerId(req);
    if (!serverId) return vpsError("serverId is required", 400);

    const pm2 = await getVpsPm2(access.db, serverId);
    return vpsJson({ data: pm2 });
  } catch (error) {
    console.error("VPS PM2 ERROR:", error);
    return vpsError("Server error", 500);
  }
}
