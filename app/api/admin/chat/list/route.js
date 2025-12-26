import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { adminDB } from "@/lib/firebaseAdmin";
import getDB from "@/lib/mongodb";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await getDB();

    // অ্যাডমিন ভেরিফিকেশন
    const admin = await db
      .collection("users")
      .findOne({ userId: decoded.uid });

    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Firebase থেকে ওপেন চ্যাট লিস্ট আনা
    const snapshot = await adminDB
      .collection("chats")
      .where("status", "==", "open")
      .orderBy("updatedAt", "desc")
      .get();

    const rawChats = snapshot.docs.map(doc => ({
      chatId: doc.id,
      ...doc.data(),
    }));

    // MongoDB থেকে ইউজারদের নাম খুঁজে বের করা
    const chatsWithUserInfo = await Promise.all(
      rawChats.map(async (chat) => {
        const user = await db
          .collection("users")
          .findOne({ userId: chat.userId }, { projection: { name: 1, photo: 1 } });
        
        return {
          ...chat,
          userName: user?.name || "Guest", // নাম না থাকলে Guest দেখাবে
          userImage: user?.photo || null,
        };
      })
    );

    return NextResponse.json({ chats: chatsWithUserInfo });

  } catch (err) {
    console.error("ADMIN CHAT LIST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}