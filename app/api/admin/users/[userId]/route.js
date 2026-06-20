import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { requireAuth, requireRoles } from "@/lib/apiGuard";

export async function GET(req, { params }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "User ID required" }, { status: 400 });
    }

    const reserved = new Set(["list", "delete", "update", "insights"]);
    if (reserved.has(String(userId).toLowerCase())) {
      return NextResponse.json({ ok: false, error: "Invalid user ID" }, { status: 400 });
    }

    const user = await db.collection("users").findOne(
      { userId },
      { projection: { password: 0 } }
    );

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("Admin user detail error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
