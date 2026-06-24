import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { requireAuth, requireRoles } from "@/lib/apiGuard";
import { listUserWalletRemainingBreakdown } from "@/lib/userWalletBreakdown";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const result = await listUserWalletRemainingBreakdown(db);

    return NextResponse.json({
      ok: true,
      totalRemaining: result.totalRemaining,
      accountCount: result.accountCount,
      accounts: result.accounts,
    });
  } catch (error) {
    console.error("User wallet breakdown error:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
