
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { trx_id, reason } = await req.json();

    if (!trx_id) {
      return NextResponse.json(
        { ok: false, error: "trx_id missing" },
        { status: 400 }
      );
    }

    const { db } = await getDB();

    // 1) Update payment status to canceled in DB
    const payment = await db.collection("payments").findOne({ trx_id });
    if (!payment) {
      return NextResponse.json(
        { ok: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    await db.collection("payments").updateOne(
      { trx_id },
      {
        $set: {
          status: "canceled",
          cancelReason: reason || "User requested cancellation",
          updatedAt: new Date(),
        },
      }
    );

    // 2) Optionally notify UddoktaPay (if they trigger your cancel URL)
    // For local development, this URL can just update your DB, as we already did.

    return NextResponse.json({
      ok: true,
      message: "Payment canceled successfully",
      trx_id,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
