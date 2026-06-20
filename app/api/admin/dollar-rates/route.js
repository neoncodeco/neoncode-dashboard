import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import {
  applyBulkDollarRateUpdate,
  buildDollarRateRows,
  filterDollarRateRows,
  setAccountUsdRate,
  setGlobalUsdRate,
  setUserUsdRate,
} from "@/lib/dollarRateManagement";
import { resolveUsdToBdtRate, DEFAULT_USD_TO_BDT_RATE } from "@/lib/currency";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || "";
    const scope = (searchParams.get("scope") || "all").toLowerCase();

    const { globalRate, rows } = await buildDollarRateRows(db);
    const filtered = filterDollarRateRows(rows, { search, scope });

    const counts = {
      all: rows.length,
      global: rows.filter((r) => r.type === "global").length,
      users: rows.filter((r) => r.type === "user").length,
      accounts: rows.filter((r) => r.type === "account").length,
      filtered: filtered.length,
    };

    return NextResponse.json({
      ok: true,
      globalRate,
      rows: filtered,
      counts,
    });
  } catch (err) {
    console.error("Dollar rates list error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin"]);
    if (!access.ok) return access.response;

    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }

    const type = String(body.type || "").toLowerCase();
    const id = String(body.id || "").trim();
    const rate = resolveUsdToBdtRate(body.rate, DEFAULT_USD_TO_BDT_RATE);

    if (rate <= 0) {
      return NextResponse.json({ ok: false, error: "Rate must be greater than 0" }, { status: 400 });
    }

    if (type === "global") {
      await setGlobalUsdRate(db, rate);
    } else if (type === "user") {
      if (!id) return NextResponse.json({ ok: false, error: "User ID required" }, { status: 400 });
      await setUserUsdRate(db, id, rate);
    } else if (type === "account") {
      if (!id) return NextResponse.json({ ok: false, error: "Account ID required" }, { status: 400 });
      await setAccountUsdRate(db, id, rate);
    } else {
      return NextResponse.json({ ok: false, error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, rate });
  } catch (err) {
    console.error("Dollar rate patch error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Server error" }, { status: 500 });
  }
}
