import { getVpsHistory } from "@/lib/vpsMonitoring";
import { readServerId, requireVpsAdmin, vpsError, vpsJson } from "@/lib/vpsApiGuard";

export async function GET(req) {
  try {
    const access = await requireVpsAdmin(req);
    if (!access.ok) return access.response;

    const { searchParams } = new URL(req.url);
    const serverId = readServerId(req);
    const range = searchParams.get("range") || "24h";

    if (!serverId) return vpsError("serverId is required", 400);

    const history = await getVpsHistory(access.db, { serverId, range });
    return vpsJson({ data: history });
  } catch (error) {
    console.error("VPS HISTORY ERROR:", error);
    return vpsError("Server error", 500);
  }
}
