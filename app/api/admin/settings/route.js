import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";
import { createDefaultBankPaymentDetails, normalizeBankPaymentDetails } from "@/lib/bankDetails";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await getDB();
    const admin = await db.collection("users").findOne({ userId: decoded.uid });

    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [bmConfigSetting, usdRateSetting, bankDetailsSetting] = await Promise.all([
      db.collection("settings").findOne({ key: "FB_BM_CONFIGS" }),
      db.collection("settings").findOne({ key: "USD_TO_BDT_RATE" }),
      db.collection("settings").findOne({ key: "BANK_PAYMENT_DETAILS" }),
    ]);

    return NextResponse.json({
      ok: true,
      bmConfigs: bmConfigSetting?.value || [],
      usdToBdtRate: resolveUsdToBdtRate(usdRateSetting?.value, DEFAULT_USD_TO_BDT_RATE),
      bankPaymentDetails: normalizeBankPaymentDetails(bankDetailsSetting?.value || createDefaultBankPaymentDetails()),
    });
  } catch (err) {
    console.error("GET Settings Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await getDB();
    const admin = await db.collection("users").findOne({ userId: decoded.uid });

    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Only Admin can change settings." }, { status: 403 });
    }

    const { bmConfigs, usdToBdtRate, bankPaymentDetails } = await req.json();
    const updates = [];

    if (Array.isArray(bmConfigs)) {
      updates.push(
        db.collection("settings").updateOne(
          { key: "FB_BM_CONFIGS" },
          { $set: { value: bmConfigs, updatedAt: new Date() } },
          { upsert: true }
        )
      );
    }

    if (usdToBdtRate !== undefined) {
      const normalizedRate = resolveUsdToBdtRate(usdToBdtRate, DEFAULT_USD_TO_BDT_RATE);
      if (normalizedRate <= 0) {
        return NextResponse.json({ error: "USD to BDT rate must be greater than 0." }, { status: 400 });
      }

      updates.push(
        db.collection("settings").updateOne(
          { key: "USD_TO_BDT_RATE" },
          { $set: { value: normalizedRate, updatedAt: new Date() } },
          { upsert: true }
        )
      );
    }

    if (bankPaymentDetails !== undefined) {
      const normalizedBankDetails = normalizeBankPaymentDetails(bankPaymentDetails);
      updates.push(
        db.collection("settings").updateOne(
          { key: "BANK_PAYMENT_DETAILS" },
          { $set: { value: normalizedBankDetails, updatedAt: new Date() } },
          { upsert: true }
        )
      );
    }

    if (!updates.length) {
      return NextResponse.json({ error: "No settings payload provided." }, { status: 400 });
    }

    await Promise.all(updates);

    return NextResponse.json({ ok: true, message: "Settings updated successfully" });
  } catch (err) {
    console.error("POST Settings Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
