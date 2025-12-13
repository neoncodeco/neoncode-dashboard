import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    // Token verify
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const { db } = await getDB();

    // Fetch all payments for this user (latest first)
    const payments = await db
      .collection("payments")
      .find({ userUid: decoded.uid })
      .sort({ createdAt: -1 })
      .toArray();

    // Format response data
    const formatted = payments.map(p => ({
      id: p.trxId,
      date: p.createdAt.toISOString(),
      description: p.method === "bank_transfer" ? "Manual Payment" : "Online Payment",
      amount: p.amount,
      method: p.method,
      status: p.status,
      screenshot: p.screenshot || null
    }));

    return NextResponse.json({
      ok: true,
      count: formatted.length,
      data: formatted,
    });

  } catch (err) {
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}