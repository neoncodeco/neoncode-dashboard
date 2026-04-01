import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

async function verifyAdminUser(req) {
  const decoded = await verifyToken(req);
  if (!decoded?.uid) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { db } = await getDB();
  const admin = await db.collection("users").findOne({ userId: decoded.uid });
  if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { db, admin };
}

function resolveObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

export async function PATCH(req, { params }) {
  try {
    const { db, admin, error } = await verifyAdminUser(req);
    if (error) return error;

    const { id } = await params;
    const objectId = resolveObjectId(id);
    if (!objectId) {
      return NextResponse.json({ error: "Invalid notification id." }, { status: 400 });
    }

    const body = await req.json();
    const title = String(body?.title || "").trim();
    const message = String(body?.message || "").trim();

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    const now = new Date();
    const update = {
      title,
      message,
      updatedAt: now,
      editedBy: {
        userId: admin.userId,
        name: admin.name || admin.email || "Admin",
        role: admin.role || "admin",
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
    const { db, error } = await verifyAdminUser(req);
    if (error) return error;

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
