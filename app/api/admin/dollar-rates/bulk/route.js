import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import { applyBulkDollarRateUpdate } from "@/lib/dollarRateManagement";

const ALLOWED_OPERATIONS = new Set([
  "set",
  "increase",
  "decrease",
  "increase_percent",
  "decrease_percent",
]);

const ALLOWED_SCOPES = new Set(["filtered", "global", "users", "accounts", "selected", "all"]);

export async function POST(req) {
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

    const operation = String(body.operation || "set").toLowerCase();
    const scope = String(body.scope || "filtered").toLowerCase();
    const value = Number(body.value);

    if (!ALLOWED_OPERATIONS.has(operation)) {
      return NextResponse.json({ ok: false, error: "Invalid operation" }, { status: 400 });
    }
    if (!ALLOWED_SCOPES.has(scope)) {
      return NextResponse.json({ ok: false, error: "Invalid scope" }, { status: 400 });
    }
    if (!Number.isFinite(value)) {
      return NextResponse.json({ ok: false, error: "Value must be a number" }, { status: 400 });
    }

    const summary = await applyBulkDollarRateUpdate(db, {
      operation,
      value,
      scope: scope === "all" ? "filtered" : scope,
      search: body.search || "",
      selected: Array.isArray(body.selected) ? body.selected : [],
    });

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("Dollar rate bulk error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Server error" }, { status: 500 });
  }
}
