import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ObjectId } from "mongodb";

export async function PUT(req) {
  try {
    const decoded = await verifyToken(req);

    if (!decoded) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Optional: Only allow admin
    if (!decoded?.isAdmin) {
      return NextResponse.json(
        { message: "Forbidden: Admin only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, status, MetaAccountID } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Missing request id" },
        { status: 400 }
      );
    }

    const { db } = await getDB();

    const updateData = {};

    if (status) updateData.status = status;
    if (MetaAccountID) updateData.MetaAccountID = MetaAccountID;

    const updated = await db.collection("adAccountRequests").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!updated.value) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Request updated successfully",
      data: updated.value,
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
