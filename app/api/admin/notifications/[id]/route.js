import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import { sanitizeText } from "@/lib/security";

function resolveObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

export async function PATCH(req, { params }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const { id } = await params;
    const objectId = resolveObjectId(id);
    if (!objectId) {
      return NextResponse.json({ error: "Invalid notification id." }, { status: 400 });
    }

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
    const update = {
      title,
      message,
      updatedAt: now,
      editedBy: {
        userId: access.user.userId,
        name: access.user.name || access.user.email || "Admin",
        role: access.user.role || "admin",
      },
    };

    const result = await db.collection("notifications").findOneAndUpdate(
      { _id: objectId },
      { $set: update },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      notification: {
        id: String(result._id),
        title: result.title,
        message: result.message,
        status: result.status || "active",
        publishedAt: result.publishedAt || result.createdAt || null,
        createdAt: result.createdAt || null,
        updatedAt: result.updatedAt || null,
        createdBy: result.createdBy || null,
      },
    });
  } catch (error) {
    console.error("PATCH ADMIN NOTIFICATION ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const { id } = await params;
    const objectId = resolveObjectId(id);
    if (!objectId) {
      return NextResponse.json({ error: "Invalid notification id." }, { status: 400 });
    }

    const result = await db.collection("notifications").deleteOne({ _id: objectId });
    if (!result.deletedCount) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE ADMIN NOTIFICATION ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
