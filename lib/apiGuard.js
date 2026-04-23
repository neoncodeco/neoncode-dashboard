import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";

export function jsonError(message, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function parseJsonBody(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function requireAuth(req) {
  const decoded = await verifyToken(req);
  if (!decoded?.uid) {
    return { ok: false, response: jsonError("Unauthorized", 401) };
  }
  return { ok: true, decoded };
}

export async function requireRoles(db, uid, roles = []) {
  const user = await db.collection("users").findOne({ userId: uid });
  if (!user) {
    return { ok: false, response: jsonError("Unauthorized", 401) };
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return { ok: false, response: jsonError("Forbidden", 403) };
  }

  return { ok: true, user };
}
