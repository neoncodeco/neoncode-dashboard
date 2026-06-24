import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { requireAuth, requireRoles } from "@/lib/apiGuard";
import { buildAvailableAdAccountsOverview } from "@/lib/availableAdAccounts";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const data = await buildAvailableAdAccountsOverview(db);

    return NextResponse.json({
      ok: true,
      ...data,
    });
  } catch (error) {
    console.error("Available ad accounts error:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
