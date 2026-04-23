import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { requireAuth, requireRoles } from "@/lib/apiGuard";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) {
      return access.response;
    }

    const users = await db
      .collection("users")
      .find(
        {},
        {
          projection: {
            password: 0,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ ok: true, users });
  } catch (err) {
    console.error("Admin users list error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
