import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { FREEPIK_PLANS } from "@/lib/freepikPlans";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await getDB();
    const user = await db.collection("users").findOne(
      { userId: decoded.uid },
      { projection: { walletBalance: 1, freepikCredits: 1, freepikSubscription: 1 } }
    );

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      plans: FREEPIK_PLANS,
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
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
