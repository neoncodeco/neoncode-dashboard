
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
   
       const admin = await db
         .collection("users")
         .findOne({ userId: decoded.uid });
   
       if (!admin || admin.role !== "admin" && admin.role !== "manager") {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
       }

    const snapshot = await adminDB
      .collection("chats")
      .where("status", "==", "open")
      .orderBy("updatedAt", "desc")
      .get();

    const chats = snapshot.docs.map(doc => ({
      chatId: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ chats });

  } catch (err) {
    console.error("ADMIN CHAT LIST ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
