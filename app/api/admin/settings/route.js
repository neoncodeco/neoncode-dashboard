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

    const [tokenSetting, usdRateSetting] = await Promise.all([
      db.collection("settings").findOne({ key: "FB_SYS_TOKEN" }),
      db.collection("settings").findOne({ key: "USD_TO_BDT_RATE" }),
    ]);

    return NextResponse.json({
      ok: true,
      token: tokenSetting?.value || "",
      usdToBdtRate: resolveUsdToBdtRate(usdRateSetting?.value, DEFAULT_USD_TO_BDT_RATE),
    });
  } catch {
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

    const { newToken, usdToBdtRate } = await req.json();
    const updates = [];

    if (typeof newToken === "string") {
      updates.push(
        db.collection("settings").updateOne(
          { key: "FB_SYS_TOKEN" },
          { $set: { value: newToken, updatedAt: new Date() } },
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

    if (!updates.length) {
      return NextResponse.json({ error: "No settings payload provided." }, { status: 400 });
    }

    await Promise.all(updates);

    return NextResponse.json({ ok: true, message: "Settings updated successfully" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
