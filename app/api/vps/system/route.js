import { getVpsSystem } from "@/lib/vpsMonitoring";
import { readServerId, requireVpsAdmin, vpsError, vpsJson } from "@/lib/vpsApiGuard";

export async function GET(req) {
  try {
    const access = await requireVpsAdmin(req);
    if (!access.ok) return access.response;

    const serverId = readServerId(req);
    if (!serverId) return vpsError("serverId is required", 400);

    const system = await getVpsSystem(access.db, serverId);
    return vpsJson({ data: system });
  } catch (error) {
    console.error("VPS SYSTEM ERROR:", error);
    return vpsError("Server error", 500);
  }
}
