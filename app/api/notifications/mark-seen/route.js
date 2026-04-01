import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded?.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await getDB();
    const now = new Date();

    await db.collection("users").updateOne(
      { userId: decoded.uid },
      { $set: { notificationLastSeenAt: now, updatedAt: now } }
    );

    return NextResponse.json({ ok: true, seenAt: now });
  } catch (error) {
    console.error("MARK NOTIFICATIONS SEEN ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
