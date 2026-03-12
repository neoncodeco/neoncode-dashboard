import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }

    const { db } = await getDB();
    const chat = await db.collection("live_chats").findOne({ chatId });

    if (!chat) {
      return NextResponse.json({ ok: true, messages: [] });
    }

    const requester = await db.collection("users").findOne(
      { userId: decoded.uid },
      { projection: { role: 1 } }
    );
    const isAdmin = requester?.role === "admin" || requester?.role === "manager";

    if (!isAdmin && chat.userId !== decoded.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await db
      .collection("live_chat_messages")
      .find({ chatId })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({
      ok: true,
      messages: messages.map((m) => ({
        id: String(m._id),
        senderRole: m.senderRole,
        type: m.type || "text",
        text: m.text || "",
        imageUrl: m.imageUrl || null,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("CHAT MESSAGES ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
