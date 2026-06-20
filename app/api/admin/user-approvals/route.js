import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import { getUserStatus, buildApprovalMeta, USER_APPROVAL_STATUSES } from "@/lib/userApproval";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "pending").toLowerCase();
    const search = String(searchParams.get("q") || "").trim().toLowerCase();

    const query =
      status === "all"
        ? { role: { $nin: ["admin", "manager"] } }
        : { status, role: { $nin: ["admin", "manager"] } };

    const users = await db
      .collection("users")
      .find(query, {
        projection: {
          password: 0,
          passwordHash: 0,
          passwordSalt: 0,
        },
      })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    const filtered = users.filter((user) => {
      if (!search) return true;
      const haystack = [
        user.name,
        user.email,
        user.userId,
        user.referralCode,
        user.referredBy,
        user.status,
        user.authProvider,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });

    const rows = filtered.map((user) => ({
      userId: user.userId,
      name: user.name || "Unnamed",
      email: user.email || "",
      photo: user.photo || "",
      status: getUserStatus(user),
      role: user.role || "user",
      authProvider: user.authProvider || "credentials",
      emailVerified: user?.emailVerification?.verified !== false,
      referredBy: user.referredBy || null,
      referralCode: user.referralCode || "",
      createdAt: user.createdAt || null,
      approval: user.approval || null,
    }));

    const allNonAdmin = await db
      .collection("users")
      .find({ role: { $nin: ["admin", "manager"] } }, { projection: { status: 1 } })
      .toArray();

    const statusCounts = {
      pending: 0,
      active: 0,
      rejected: 0,
      inactive: 0,
    };

    for (const u of allNonAdmin) {
      const s = getUserStatus(u);
      if (statusCounts[s] !== undefined) statusCounts[s] += 1;
    }

    return NextResponse.json({ ok: true, rows, counts: statusCounts, total: rows.length });
  } catch (err) {
    console.error("User approvals list error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

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

    const userId = String(body.userId || "").trim();
    const action = String(body.action || "").toLowerCase();
    const note = String(body.note || "").trim();

    if (!userId) {
      return NextResponse.json({ ok: false, error: "User ID required" }, { status: 400 });
    }

    if (userId === auth.decoded.uid) {
      return NextResponse.json({ ok: false, error: "You cannot modify your own account here" }, { status: 400 });
    }

    const target = await db.collection("users").findOne({ userId });
    if (!target) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if (["admin", "manager"].includes(String(target.role || "").toLowerCase())) {
      return NextResponse.json({ ok: false, error: "Cannot modify admin accounts from approvals" }, { status: 400 });
    }

    if (action === "delete") {
      await db.collection("users").deleteOne({ userId });
      await db.collection("otherCollection").insertOne({
        userUid: userId,
        type: "USER_APPROVAL",
        title: "User registration deleted",
        description: `Deleted by admin. ${note || ""}`.trim(),
        status: "deleted",
        createdAt: new Date(),
      });
      return NextResponse.json({ ok: true, message: "User deleted" });
    }

    let nextStatus = "";
    let title = "";

    switch (action) {
      case "approve":
        nextStatus = USER_APPROVAL_STATUSES.ACTIVE;
        title = "User registration approved";
        break;
      case "reject":
        nextStatus = USER_APPROVAL_STATUSES.REJECTED;
        title = "User registration rejected";
        break;
      case "block":
        nextStatus = USER_APPROVAL_STATUSES.INACTIVE;
        title = "User account blocked";
        break;
      default:
        return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    await db.collection("users").updateOne(
      { userId },
      {
        $set: {
          status: nextStatus,
          approval: buildApprovalMeta(target.approval, auth.decoded.uid, note),
          updatedAt: new Date(),
        },
      }
    );

    await db.collection("otherCollection").insertOne({
      userUid: userId,
      type: "USER_APPROVAL",
      title,
      description: `${target.email || userId}${note ? ` — ${note}` : ""}`,
      status: nextStatus,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, status: nextStatus, message: `${action} successful` });
  } catch (err) {
    console.error("User approval action error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
