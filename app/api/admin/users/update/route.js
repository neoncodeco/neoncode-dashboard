import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await getDB();

    const admin = await db
      .collection("users")
      .findOne({ userId: decoded.uid });

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, role, permissions } = await req.json();

    if (!userId || !role || !permissions) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          permissions,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
