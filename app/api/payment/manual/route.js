import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req) {
  try {
    // 🛡 Token Verify
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 📝 Receive JSON Body
    const { amount, trxId, screenshotUrl } = await req.json();

    // ❗ Validate
    if (!amount || !trxId || !screenshotUrl) {
      return NextResponse.json(
        { ok: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // 📦 DB Connection
    const { db } = await getDB();

    // 💾 Save to DB
    await db.collection("payments").insertOne({
      userUid: decoded.uid,
      email: decoded.email,
      amount: Number(amount),
      trxId,
      screenshotUrl, // <-- now URL is saved
      method: "bank_transfer",
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      message: "Manual payment submitted successfully",
    });

  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
