import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { db } = await getDB();

    const ticket = await db.collection("tickets").findOne({
      _id: new ObjectId(id),
      userId: decoded.uid, 
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
    console.error("GET TICKET ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
