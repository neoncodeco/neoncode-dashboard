import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    // 1️⃣ Verify Firebase token
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Parse body (NOW includes screenshots)
    const { ticketId, text = "", screenshots = [] } = await req.json();

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId required" },
        { status: 400 }
      );
    }

    const { db } = await getDB();

    // 3️⃣ Load staff from DB
    const staff = await db.collection("users").findOne({
      userId: decoded.uid,
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Role check
    if (!["admin", "manager"].includes(staff.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 5️⃣ Push reply message
    await db.collection("tickets").updateOne(
      { _id: new ObjectId(ticketId) },
      {
        $push: {
          messages: {
            senderType: "staff",
            senderId: decoded.uid,
            senderName: staff.name,
            senderRole: staff.role,     // admin / manager
            senderPhoto: staff.photo,
            text: text || "",
            screenshots,               // ✅ NEW
            createdAt: new Date(),
          },
        },
        $set: {
          status: "answered",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("ADMIN REPLY ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
