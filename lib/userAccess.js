import { NextResponse } from "next/server";

export const READ_ONLY_USER_STATUSES = new Set(["inactive", "blocked"]);

export const isReadOnlyUserStatus = (status) =>
  READ_ONLY_USER_STATUSES.has(String(status || "").trim().toLowerCase());

export const getReadOnlyMessage = () =>
  "Your account is in read-only mode. You can browse the dashboard, but new actions are disabled.";

export async function ensureWritableUser(db, userId) {
  const user = await db.collection("users").findOne(
    { userId },
    { projection: { status: 1, role: 1, name: 1, email: 1 } }
  );

  if (!user) {
    return {
      ok: false,
      user: null,
      response: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  if (isReadOnlyUserStatus(user.status)) {
    return {
      ok: false,
      user,
      response: NextResponse.json(
        { error: getReadOnlyMessage(), readOnly: true, status: user.status || "inactive" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user, response: null };
}
