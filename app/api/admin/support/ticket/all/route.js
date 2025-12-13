
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  const decoded = await verifyToken(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await getDB();
  const admin = await db.collection("users").findOne({ userId: decoded.uid });

  if (!["admin", "manager"].includes(admin.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tickets = await db
    .collection("tickets")
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json({ ok: true, data: tickets });
}
