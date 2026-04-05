import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { FREEPIK_PLANS } from "@/lib/freepikPlans";
import { DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";

// 🔥 in-memory cache
let cachedRate = null;
let rateLastFetch = 0;

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);

    if (!decoded) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { db } = await getDB();

    // 🚀 parallel query + cache
    const [user, rateSetting] = await Promise.all([
      db.collection("users").findOne(
        { userId: decoded.uid },
        {
          projection: {
            walletBalance: 1,
            freepikCredits: 1,
            freepikSubscription: 1,
          },
        }
      ),

      (async () => {
        if (cachedRate && Date.now() - rateLastFetch < 60000) {
          return { value: cachedRate };
        }

        const data = await db
          .collection("settings")
          .findOne({ key: "USD_TO_BDT_RATE" });

        cachedRate = data?.value;
        rateLastFetch = Date.now();

        return data;
      })(),
    ]);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const usdToBdtRate = resolveUsdToBdtRate(
      rateSetting?.value,
      DEFAULT_USD_TO_BDT_RATE
    );

    return NextResponse.json({
      ok: true,
      plans: FREEPIK_PLANS,
      usdToBdtRate,
      walletBalance: Number(user.walletBalance || 0),
      freepikCredits: Number(user.freepikCredits || 0),
      subscription: user.freepikSubscription || {
        planId: null,
        planName: null,
        status: "inactive",
        purchasedAt: null,
        expiresAt: null,
      },
    });
  } catch (error) {
    console.error("FREEPIK PLANS ERROR:", error);

    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}