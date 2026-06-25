import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { jsonError, requireAuth, requireRoles } from "@/lib/apiGuard";

export async function requireVpsAdmin(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth;

  const { db } = await getDB();
  const access = await requireRoles(db, auth.decoded.uid, ["admin"]);
  if (!access.ok) return access;

  return { ok: true, db, user: access.user };
}

export function vpsJson(data, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function vpsError(message, status = 400) {
  return jsonError(message, status);
}

export function readServerId(req) {
  const { searchParams } = new URL(req.url);
  return searchParams.get("serverId") || "";
}
