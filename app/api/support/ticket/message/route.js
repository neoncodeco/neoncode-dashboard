
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ObjectId } from "mongodb";

export async function POST(req) {
  const decoded = await verifyToken(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticketId, text, screenshots = [] } = await req.json();
  const { db } = await getDB();

  const user = await db.collection("users").findOne({ userId: decoded.uid });

  await db.collection("tickets").updateOne(
    { _id: new ObjectId(ticketId), status: { $ne: "closed" } },
    {
      $push: {
        messages: {
          senderType: "user",
          senderId: decoded.uid,
          senderName: user.name,
          senderRole: "user",
          senderPhoto: user.photo,
          text,
          screenshots,
          createdAt: new Date(),
        },
      },
      $set: { updatedAt: new Date() },
    }
  );

  return NextResponse.json({ ok: true });
}
