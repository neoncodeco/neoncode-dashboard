
// app/api/users/role-update/route.js
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import getDB from "@/lib/mongodb";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden: admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { uid, role } = body;
    if (!uid || !role) {
      return NextResponse.json({ message: "uid and role required" }, { status: 400 });
    }
    const allowed = ["user", "manager", "admin"];
    if (!allowed.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const { db } = await getDB();
    const res = await db.collection("users").findOneAndUpdate(
      { uid },
      { $set: { role, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!res.value) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: res.value });
  } catch (err) {
    console.error("role-update error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
