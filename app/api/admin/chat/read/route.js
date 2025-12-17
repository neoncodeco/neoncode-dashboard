import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { adminDB } from "@/lib/firebaseAdmin";

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

    const { chatId } = await req.json();

    await adminDB.collection("chats").doc(chatId).update({
      unreadForAdmin: 0,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
