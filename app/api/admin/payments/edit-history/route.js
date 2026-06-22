import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getDB from "@/lib/mongodb";
import { requireAuth, requireRoles } from "@/lib/apiGuard";
import { serializeMongoId } from "@/lib/serializeMongoId";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const { searchParams } = new URL(req.url);
    const paymentId = serializeMongoId(searchParams.get("paymentId"));
    if (!paymentId || !ObjectId.isValid(paymentId)) {
      return NextResponse.json({ ok: false, error: "Valid payment ID is required" }, { status: 400 });
    }

    const [payment, logs] = await Promise.all([
      db.collection("payments").findOne(
        { _id: new ObjectId(paymentId) },
        { projection: { adminEditHistory: 1, userUid: 1 } }
      ),
      db
        .collection("payment_admin_edit_logs")
        .find({ paymentId })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
    ]);

    if (!payment) {
      return NextResponse.json({ ok: false, error: "Payment not found" }, { status: 404 });
    }

    const embedded = Array.isArray(payment.adminEditHistory) ? payment.adminEditHistory : [];
    const merged = logs.length > 0 ? logs : embedded;

    return NextResponse.json({
      ok: true,
      history: merged.map((entry, index) => ({
        id: serializeMongoId(entry._id) || `edit-${index}`,
        adminUid: entry.adminUid,
        adminName: entry.adminName || "Admin",
        adminEmail: entry.adminEmail || "",
        before: entry.before || {},
        after: entry.after || {},
        changes: entry.changes || [],
        walletDelta: Number(entry.walletDelta || 0),
        createdAt: entry.createdAt || null,
      })),
    });
  } catch (error) {
    console.error("PAYMENT EDIT HISTORY ERROR:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
