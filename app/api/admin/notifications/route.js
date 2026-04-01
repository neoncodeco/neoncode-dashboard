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

export async function GET(req) {
  try {
    const { db, error } = await verifyAdminUser(req);
    if (error) return error;

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
    const { db, admin, error } = await verifyAdminUser(req);
    if (error) return error;

    const body = await req.json();
    const title = String(body?.title || "").trim();
    const message = String(body?.message || "").trim();

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
        userId: admin.userId,
        name: admin.name || admin.email || "Admin",
        role: admin.role || "admin",
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
