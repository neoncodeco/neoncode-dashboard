import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { normalizeAssignedAccounts } from "@/lib/adAccountRequests";
import { serializeMongoId } from "@/lib/serializeMongoId";

const assertAdmin = async (req) => {
  const decoded = await verifyToken(req);
  if (!decoded) return { error: "Unauthorized", status: 401 };

  const { db } = await getDB();
  const admin = await db.collection("users").findOne({ userId: decoded.uid });
  if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
    return { error: "Forbidden", status: 403 };
  }

  return { db };
};

export async function GET(req, { params }) {
  try {
    const auth = await assertAdmin(req);
    if (auth.error) {
      return NextResponse.json({ ok: false, message: auth.error }, { status: auth.status });
    }
    const { db } = auth;

    const { id: rawId } = await params;
    const id = serializeMongoId(rawId);
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, message: "Invalid request ID" }, { status: 400 });
    }

    const doc = await db.collection("adAccountRequests").findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ ok: false, message: "Ad account not found" }, { status: 404 });
    }

    const assignedAccounts = normalizeAssignedAccounts(doc.assignedAccounts, doc);
    let linkedUser = null;
    if (doc.userUid) {
      linkedUser = await db.collection("users").findOne(
        { userId: doc.userUid },
        { projection: { userId: 1, name: 1, email: 1, photo: 1, status: 1, role: 1, walletBalance: 1 } }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...doc,
        _id: serializeMongoId(doc._id),
        assignedAccounts,
        linkedUser,
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Server error", error: err.message }, { status: 500 });
  }
}
