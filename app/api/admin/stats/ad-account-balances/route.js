import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { requireAuth, requireRoles } from "@/lib/apiGuard";
import { listAdAccountAvailableBalances } from "@/lib/metaAccountBalance";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const result = await listAdAccountAvailableBalances(db);

    return NextResponse.json({
      ok: true,
      totalAvailableBalance: result.totalAvailableBalance,
      accountCount: result.liveAccountCount,
      accounts: result.accounts,
    });
  } catch (error) {
    console.error("Ad account balances error:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
