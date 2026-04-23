import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { convertBdtToUsd, DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";
import { ensureWritableUser } from "@/lib/userAccess";
import { parseWholeNumberAmount } from "@/lib/wholeAmount";
import { isSafeHttpUrl, sanitizeText } from "@/lib/security";

const MIN_BANK_PAYMENT_AMOUNT_BDT = 1000;

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
    const amountBdt = parseWholeNumberAmount(amount);
    const normalizedTrxId = sanitizeText(trxId, 120);
    const normalizedScreenshotUrl = String(screenshotUrl || "").trim();

    if (amountBdt === null || !normalizedTrxId || !normalizedScreenshotUrl) {
      return NextResponse.json(
        { ok: false, error: "Valid whole-number BDT amount, transaction ID, and screenshot are required" },
        { status: 400 }
      );
    }

    if (!isSafeHttpUrl(normalizedScreenshotUrl)) {
      return NextResponse.json({ ok: false, error: "Screenshot URL must be a valid http(s) URL" }, { status: 400 });
    }

    const { db } = await getDB();
    const access = await ensureWritableUser(db, decoded.uid);
    if (!access.ok) {
      return access.response;
    }

    if (amountBdt < MIN_BANK_PAYMENT_AMOUNT_BDT) {
      return NextResponse.json(
        { ok: false, error: `Bank payment requires at least Tk ${MIN_BANK_PAYMENT_AMOUNT_BDT}.` },
        { status: 400 }
      );
    }

    const usdToBdtRate = await getCurrentUsdToBdtRate(db);

    await db.collection("payments").insertOne({
      userUid: decoded.uid,
      email: decoded.email,
      amount: amountBdt,
      amountBdt,
      creditedUsdAmount: convertBdtToUsd(amountBdt, usdToBdtRate),
      currency: "BDT",
      usdToBdtRate,
      trxId: normalizedTrxId,
      screenshotUrl: normalizedScreenshotUrl,
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
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
