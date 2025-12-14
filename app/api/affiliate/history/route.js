
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    const { db } = await getDB();

    const history = await db
      .collection("referral_history")
      .find({ referrerId: decoded.uid })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({ ok: true, data: history });
  } catch (e) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
