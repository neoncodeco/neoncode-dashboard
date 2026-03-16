import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { convertBdtToUsd, DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";

const getCurrentUsdToBdtRate = async (db) => {
  const rateSetting = await db.collection("settings").findOne({ key: "USD_TO_BDT_RATE" });
  return resolveUsdToBdtRate(rateSetting?.value, DEFAULT_USD_TO_BDT_RATE);
};

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { amount, trxId, screenshotUrl } = await req.json();
    const amountBdt = Number(amount);

    if (!amountBdt || amountBdt <= 0 || !trxId || !screenshotUrl) {
      return NextResponse.json(
        { ok: false, error: "Valid BDT amount, transaction ID, and screenshot are required" },
        { status: 400 }
      );
    }

    const { db } = await getDB();
    const usdToBdtRate = await getCurrentUsdToBdtRate(db);

    await db.collection("payments").insertOne({
      userUid: decoded.uid,
      email: decoded.email,
      amount: amountBdt,
      amountBdt,
      creditedUsdAmount: convertBdtToUsd(amountBdt, usdToBdtRate),
      currency: "BDT",
      usdToBdtRate,
      trxId,
      screenshotUrl,
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
