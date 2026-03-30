
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await getDB();
    const admin = await db.collection("users").findOne({ userId: decoded.uid });

    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // মাল্টিপল বিএম সেটিংস (FB_BM_CONFIGS) এবং ইউএসডি রেট লোড করা
    const [bmConfigSetting, usdRateSetting] = await Promise.all([
      db.collection("settings").findOne({ key: "FB_BM_CONFIGS" }),
      db.collection("settings").findOne({ key: "USD_TO_BDT_RATE" }),
    ]);

    return NextResponse.json({
      ok: true,
      // ডাটাবেসে বিএম লিস্ট না থাকলে খালি অ্যারে [] পাঠাবে
      bmConfigs: bmConfigSetting?.value || [], 
      usdToBdtRate: resolveUsdToBdtRate(usdRateSetting?.value, DEFAULT_USD_TO_BDT_RATE),
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

    // শুধুমাত্র Admin সেটিংস পরিবর্তন করতে পারবে
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Only Admin can change settings." }, { status: 403 });
    }

    const { bmConfigs, usdToBdtRate } = await req.json();
    const updates = [];

    // ১. মাল্টিপল বিএম সেটিংস আপডেট (bmConfigs এখন একটি Array হিসেবে আসবে)
    if (Array.isArray(bmConfigs)) {
      updates.push(
        db.collection("settings").updateOne(
          { key: "FB_BM_CONFIGS" },
          { $set: { value: bmConfigs, updatedAt: new Date() } },
          { upsert: true }
        )
      );
    }

    // ২. কারেন্সি রেট আপডেট
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

    if (!updates.length) {
      return NextResponse.json({ error: "No settings payload provided." }, { status: 400 });
    }

    await Promise.all(updates);

    return NextResponse.json({ ok: true, message: "Multi-BM settings updated successfully" });
  } catch (err) {
    console.error("POST Settings Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}