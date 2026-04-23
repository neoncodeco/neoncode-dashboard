import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";

export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin"]);
    if (!access.ok) {
      return access.response;
    }

    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (userId === auth.decoded.uid) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const targetUser = await db.collection("users").findOne({ userId });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.collection("users").deleteOne({ userId });

    return NextResponse.json({ ok: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("USER DELETE ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
