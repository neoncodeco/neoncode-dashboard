import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const uid = decoded.uid;

    const { db } = await getDB();
    const adminUser = await db.collection("users").findOne({ userId: uid });

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { userUid, action } = await req.json();

    if (!userUid || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const payment = await db
      .collection("payments")
      .findOne({ userUid, status: "pending" }, { sort: { createdAt: -1 } });

    if (!payment) {
      return NextResponse.json({ ok: false, error: "No pending payment" });
    }

    if (action === "approve") {
      await db
        .collection("users")
        .updateOne(
          { userId: userUid },
          {
            $inc: {
              topupBalance: payment.amount,
              walletBalance: payment.amount,
            },
          }
        );

      await db
        .collection("payments")
        .updateOne(
          { _id: payment._id },
          { $set: { status: "approved", updatedAt: new Date() } }
        );

      return NextResponse.json({ ok: true, message: "Payment approved" });
    }

    await db
      .collection("payments")
      .updateOne(
        { _id: payment._id },
        { $set: { status: "rejected", updatedAt: new Date() } }
      );

    return NextResponse.json({ ok: true, message: "Payment rejected" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }
}
