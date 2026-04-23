import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { parseJsonBody, requireAuth, requireRoles } from "@/lib/apiGuard";
import { convertBdtToUsd, DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";

const REQUIRED_TOTAL = 2000;
const ONE_TIME_COMMISSION = 10;

const LEVEL1_MILESTONES = [
  { count: 10, reward: 50 },
  { count: 25, reward: 150 },
  { count: 50, reward: 400 },
];

const getCreditedUsdAmount = async (db, payment) => {
  if (Number(payment.creditedUsdAmount) > 0) {
    return {
      amountBdt: Number((payment.amountBdt ?? payment.amount) || 0),
      usdToBdtRate: resolveUsdToBdtRate(payment.usdToBdtRate, DEFAULT_USD_TO_BDT_RATE),
      creditedUsdAmount: Number(payment.creditedUsdAmount),
    };
  }

  const amountBdt = Number((payment.amountBdt ?? payment.amount) || 0);
  const fallbackRateSetting = await db.collection("settings").findOne({ key: "USD_TO_BDT_RATE" });
  const usdToBdtRate = resolveUsdToBdtRate(
    payment.usdToBdtRate,
    resolveUsdToBdtRate(fallbackRateSetting?.value, DEFAULT_USD_TO_BDT_RATE)
  );

  return {
    amountBdt,
    usdToBdtRate,
    creditedUsdAmount: convertBdtToUsd(amountBdt, usdToBdtRate),
  };
};

export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) {
      return access.response;
    }

    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
    }
    const { userUid, action } = body;

    if (!userUid || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const payment = await db.collection("payments").findOne(
      { userUid, status: "pending" },
      { sort: { createdAt: -1 } }
    );

    if (!payment) {
      return NextResponse.json({
        ok: false,
        error: "No pending payment found",
      });
    }

    if (action === "approve") {
      const { amountBdt, usdToBdtRate, creditedUsdAmount } = await getCreditedUsdAmount(db, payment);

      if (Number.isNaN(amountBdt) || amountBdt <= 0 || creditedUsdAmount <= 0) {
        return NextResponse.json(
          { ok: false, error: "Invalid payment amount" },
          { status: 400 }
        );
      }

      const user = await db
        .collection("users")
        .findOne({ userId: userUid });

      if (!user) {
        return NextResponse.json(
          { ok: false, error: "User not found" },
          { status: 404 }
        );
      }

      const nextWalletBalance = Number(user.walletBalance || 0) + creditedUsdAmount;
      const nextTopupBalance = Number(user.topupBalance || 0) + creditedUsdAmount;

      await db.collection("users").updateOne(
        { userId: userUid },
        {
          $set: {
            walletBalance: nextWalletBalance,
            topupBalance: nextTopupBalance,
            updatedAt: new Date(),
          },
        }
      );

      await db.collection("payments").updateOne(
        { _id: payment._id },
        {
          $set: {
            status: "approved",
            amountBdt,
            creditedUsdAmount,
            currency: "BDT",
            usdToBdtRate,
            updatedAt: new Date(),
          },
        }
      );

      if (
        user?.referredBy &&
        !user.thresholdRewardGiven &&
        nextTopupBalance >= REQUIRED_TOTAL
      ) {
        const referrer = await db
          .collection("users")
          .findOne({ userId: user.referredBy });

        if (referrer) {
          await db.collection("users").updateOne(
            { userId: referrer.userId },
            {
              $inc: {
                level1DepositCount: 1,
                "referralStats.totalReferIncome": ONE_TIME_COMMISSION,
              },
            }
          );

          await db.collection("users").updateOne(
            { userId: userUid },
            { $set: { thresholdRewardGiven: true } }
          );

          await db.collection("referral_history").insertOne({
            referrerId: referrer.userId,
            referredUserId: userUid,
            reachedAmount: nextTopupBalance,
            reward: ONE_TIME_COMMISSION,
            type: "level1-2000-threshold",
            createdAt: new Date(),
          });

          const updatedReferrer = await db
            .collection("users")
            .findOne({ userId: referrer.userId });

          const milestone = LEVEL1_MILESTONES.find(
            (m) => m.count === updatedReferrer.level1DepositCount
          );

          if (milestone) {
            await db.collection("users").updateOne(
              { userId: referrer.userId },
              {
                $inc: {
                  "referralStats.totalReferIncome": milestone.reward,
                },
              }
            );

            await db.collection("milestone_history").insertOne({
              userId: referrer.userId,
              level: 1,
              count: milestone.count,
              reward: milestone.reward,
              createdAt: new Date(),
            });
          }
        }
      }

      return NextResponse.json({
        ok: true,
        message: "Payment approved and balances updated safely",
      });
    }

    await db.collection("payments").updateOne(
      { _id: payment._id },
      {
        $set: {
          status: "rejected",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      ok: true,
      message: "Payment rejected",
    });
  } catch (error) {
    console.error("PAYMENT APPROVE ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
