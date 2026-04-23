import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import { DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";
import { createDefaultBankPaymentDetails, normalizeBankPaymentDetails } from "@/lib/bankDetails";

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

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
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin"]);
    if (!access.ok) return access.response;

    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }
    const { bmConfigs, usdToBdtRate, bankPaymentDetails } = body;
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
