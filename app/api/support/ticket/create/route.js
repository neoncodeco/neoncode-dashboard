
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req) {
  const decoded = await verifyToken(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, message, screenshots = [] } = await req.json();
  const { db } = await getDB();

  const user = await db.collection("users").findOne({ userId: decoded.uid });

  const ticket = {
    ticketId: "TKT-" + Date.now(),
    userId: decoded.uid,
    subject,
    status: "open",
    messages: [
      {
        senderType: "user",
        senderId: decoded.uid,
        senderName: user.name,
        senderRole: "user",
        senderPhoto: user.photo,
        text: message,
        screenshots,
        createdAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const res = await db.collection("tickets").insertOne(ticket);

  return NextResponse.json({ ok: true, ticketId: res.insertedId });
}
