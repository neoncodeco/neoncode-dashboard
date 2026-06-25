import { getVpsNetwork } from "@/lib/vpsMonitoring";
import { readServerId, requireVpsAdmin, vpsError, vpsJson } from "@/lib/vpsApiGuard";

export async function GET(req) {
  try {
    const access = await requireVpsAdmin(req);
    if (!access.ok) return access.response;

    const serverId = readServerId(req);
    if (!serverId) return vpsError("serverId is required", 400);

    const network = await getVpsNetwork(access.db, serverId);
    return vpsJson({ data: network });
  } catch (error) {
    console.error("VPS NETWORK ERROR:", error);
    return vpsError("Server error", 500);
  }
}
