import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uid = decoded.uid;

    const { db } = await getDB();
    const admin = await db.collection("users").findOne({ userId:uid });

    if (!admin || admin.role !== "admin" && admin.role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await db.collection("payments")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ ok: true, payments });

  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
