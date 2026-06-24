import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { requireAuth, requireRoles } from "@/lib/apiGuard";
import {
  countAdminStaffLogsByCategory,
  filterAdminStaffLogs,
  loadAdminStaffLogs,
  paginateAdminStaffLogs,
} from "@/lib/adminStaffLogs";

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const { searchParams } = new URL(req.url);
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(50, parsePositiveInt(searchParams.get("limit"), 15));
    const category = (searchParams.get("category") || "all").toLowerCase();
    const query = (searchParams.get("q") || "").trim();

    const allItems = await loadAdminStaffLogs(db);
    const filtered = filterAdminStaffLogs(allItems, { category, query });
    const counts = countAdminStaffLogsByCategory(allItems);
    const { data, pagination } = paginateAdminStaffLogs(filtered, { page, limit });

    return NextResponse.json({
      ok: true,
      data,
      counts,
      pagination,
    });
  } catch (error) {
    console.error("Admin staff logs error:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
