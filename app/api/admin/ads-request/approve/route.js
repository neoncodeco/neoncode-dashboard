import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ObjectId } from "mongodb";

export async function PUT(req) {
  try {
    /* ========= AUTH ========= */
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ========= DB ========= */
    const { db } = await getDB();

    /* ========= ROLE CHECK ========= */
    const admin = await db.collection("users").findOne({
      userId: decoded.uid,
    });

    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    /* ========= BODY ========= */
    const { id, status, MetaAccountID } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Missing request id" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (MetaAccountID !== undefined)
      updateData.MetaAccountID = MetaAccountID;

    const updated = await db
      .collection("adAccountRequests")
      .findOneAndUpdate(
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
