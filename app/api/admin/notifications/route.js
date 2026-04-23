import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import { sanitizeText } from "@/lib/security";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const notifications = await db
      .collection("notifications")
      .find({})
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(25)
      .toArray();

    return NextResponse.json({
      ok: true,
      notifications: notifications.map((item) => ({
        id: String(item._id),
        title: item.title || "Platform Update",
        message: item.message || "",
        status: item.status || "active",
        publishedAt: item.publishedAt || item.createdAt || null,
        createdAt: item.createdAt || null,
        createdBy: item.createdBy || null,
      })),
    });
  } catch (error) {
    console.error("ADMIN GET NOTIFICATIONS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }
    const title = sanitizeText(body?.title, 160);
    const message = sanitizeText(body?.message, 2000);

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    const now = new Date();
    const document = {
      title,
      message,
      status: "active",
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      createdBy: {
        userId: access.user.userId,
        name: access.user.name || access.user.email || "Admin",
        role: access.user.role || "admin",
      },
    };

    const result = await db.collection("notifications").insertOne(document);

    return NextResponse.json({
      ok: true,
      notification: {
        id: String(result.insertedId),
        ...document,
      },
    });
  } catch (error) {
    console.error("ADMIN POST NOTIFICATIONS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
