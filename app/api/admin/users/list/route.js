
// app/api/admin/users/list/route.js
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (decoded.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { db } = await getDB();
    const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ ok: true, count: users.length, data: users });
  } catch (err) {
    console.error("admin users list error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
