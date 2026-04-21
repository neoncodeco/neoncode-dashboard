import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

function normalizeLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = normalizeLimit(searchParams.get("limit"));

    const { db } = await getDB();
    const user = await db.collection("users").findOne(
      { userId: decoded.uid },
      { projection: { notificationLastSeenAt: 1 } }
    );

    const lastSeenAt = user?.notificationLastSeenAt ? new Date(user.notificationLastSeenAt) : null;
    const notificationsQuery = { status: "active" };
    const unseenQuery = lastSeenAt
      ? { ...notificationsQuery, publishedAt: { $gt: lastSeenAt } }
      : notificationsQuery;

    const [notifications, unseenCount] = await Promise.all([
      db
        .collection("notifications")
        .find(notificationsQuery)
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(limit)
        .toArray(),
      db.collection("notifications").countDocuments(unseenQuery),
    ]);

    return NextResponse.json({
      ok: true,
      notifications: notifications.map((item) => {
        const publishedAt = item.publishedAt || item.createdAt || new Date();
        const isSeen = lastSeenAt ? new Date(publishedAt) <= lastSeenAt : false;

        return {
          id: String(item._id),
          title: item.title || "Platform Update",
          message: item.message || "",
          publishedAt,
          createdAt: item.createdAt || publishedAt,
          createdBy: item.createdBy || null,
          isSeen,
        };
      }),
      unseenCount,
      lastSeenAt,
      fetchedAt: new Date(),
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
