
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req, { params }) {
  try {

    const { id } = await params;
    // 1️⃣ Verify Firebase token
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { db } = await getDB();

    // 2️⃣ Load user from DB
    const user = await db.collection("users").findOne({
      userId: decoded.uid,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 3️⃣ Role check (ADMIN / MANAGER)
    if (!["admin", "manager"].includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 4️⃣ Fetch ticket (admin can see all)
    const ticket = await db.collection("tickets").findOne({
      _id: new ObjectId(id),
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: ticket,
    });

  } catch (err) {
    console.error("ADMIN GET TICKET ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
