import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { adminDB } from "@/lib/firebaseAdmin";
import getDB from "@/lib/mongodb"; // getDB ইম্পোর্ট নিশ্চিত করুন

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

    if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { chatId, userId } = await req.json();

    // ১. আনরিড কাউন্ট ০ করা
    await adminDB.collection("chats").doc(chatId).update({
      unreadForAdmin: 0,
    });

    // ২. MongoDB থেকে ইউজারের তথ্য নিয়ে আসা
    const userData = await db
      .collection("users")
      .findOne({ userId: userId }, { projection: { name: 1, photo: 1 } });

    return NextResponse.json({ 
      ok: true, 
      user: {
        name: userData?.name || "Unknown User",
        image: userData?.photo || null
      }
    });
  } catch (err) {
    console.error("READ API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}