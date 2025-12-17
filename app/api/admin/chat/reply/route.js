import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { adminDB } from "@/lib/firebaseAdmin";
import getDB from "@/lib/mongodb";

// 🔥 IMPORTANT FIX
import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await getDB();
    const adminUser = await db
      .collection("users")
      .findOne({ userId: decoded.uid });

    if (!adminUser || adminUser.role !== "admin" && adminUser.role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { chatId, text } = await req.json();
    if (!chatId || !text?.trim()) {
      return NextResponse.json(
        { error: "chatId and text required" },
        { status: 400 }
      );
    }

    // ✅ Save admin message
    await adminDB
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .add({
        senderRole: "admin",
        type: "text",
        text,
        createdAt: FieldValue.serverTimestamp(),
        seen: false,
      });

    // ✅ Update chat meta
    await adminDB.collection("chats").doc(chatId).update({
      lastMessage: text,
      lastSender: "admin",
      unreadForUser: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ADMIN REPLY ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
