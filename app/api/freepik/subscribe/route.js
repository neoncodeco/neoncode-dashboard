import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { getFreepikPlanById } from "@/lib/freepikPlans";
import { convertBdtToUsd, DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";
import { ensureWritableUser } from "@/lib/userAccess";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = getFreepikPlanById(body?.planId);

    if (!plan) {
      return NextResponse.json({ ok: false, error: "Invalid plan selected" }, { status: 400 });
    }

    const { db } = await getDB();
    const access = await ensureWritableUser(db, decoded.uid);
    if (!access.ok) {
      return access.response;
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const rateSetting = await db.collection("settings").findOne({ key: "USD_TO_BDT_RATE" });
    const usdToBdtRate = resolveUsdToBdtRate(rateSetting?.value, DEFAULT_USD_TO_BDT_RATE);
    const planPriceUsd = convertBdtToUsd(plan.price, usdToBdtRate);

    if (plan.id === "free") {
      const existingFreePlan = await db.collection("freepik_subscriptions").findOne(
        { userUid: decoded.uid, planId: "free" },
        { projection: { _id: 1 } }
      );

      if (existingFreePlan) {
        return NextResponse.json(
          { ok: false, error: "Free plan can only be activated once per account" },
          { status: 400 }
        );
      }
    }

    const query = { userId: decoded.uid };
    if (planPriceUsd > 0) {
      query.walletBalance = { $gte: planPriceUsd };
    }

    const updateResult = await db.collection("users").findOneAndUpdate(
      query,
      {
        $inc: {
          walletBalance: -planPriceUsd,
          freepikCredits: plan.credits,
        },
        $set: {
          freepikSubscription: {
            planId: plan.id,
            planName: plan.name,
            status: "active",
            purchasedAt: now,
            expiresAt,
          },
          updatedAt: now,
        },
      },
      {
        returnDocument: "after",
        projection: { walletBalance: 1, freepikCredits: 1, freepikSubscription: 1, email: 1 },
      }
    );

    const updatedUser = updateResult?.value || updateResult;
    if (!updatedUser) {
      return NextResponse.json(
        { ok: false, error: "Insufficient wallet balance for this plan" },
        { status: 400 }
      );
    }

    await db.collection("freepik_subscriptions").insertOne({
      userUid: decoded.uid,
      email: updatedUser.email || decoded.email || "",
      planId: plan.id,
      planName: plan.name,
      priceBdt: plan.price,
      priceUsd: planPriceUsd,
      usdToBdtRate,
      creditsAdded: plan.credits,
      walletAfter: Number(updatedUser.walletBalance || 0),
      freepikCreditsAfter: Number(updatedUser.freepikCredits || 0),
      status: "active",
      purchasedAt: now,
      expiresAt,
    });

    await db.collection("otherCollection").insertOne({
      userUid: decoded.uid,
      type: "freepik_subscription",
      title: `Subscribed to ${plan.name}`,
      description: `${plan.credits} credits added. Wallet debited $${planPriceUsd.toFixed(2)} (${plan.price} BDT).`,
      status: "active",
      createdAt: now,
    });

    return NextResponse.json({
      ok: true,
      message: `${plan.name} plan activated successfully`,
      data: {
        walletBalance: Number(updatedUser.walletBalance || 0),
        freepikCredits: Number(updatedUser.freepikCredits || 0),
        subscription: updatedUser.freepikSubscription,
      },
    });
  } catch (error) {
    console.error("FREEPIK SUBSCRIBE ERROR:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
