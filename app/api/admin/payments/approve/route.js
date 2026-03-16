import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
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
    return Number(payment.creditedUsdAmount);
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
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { db } = await getDB();

    const admin = await db
      .collection("users")
      .findOne({ userId: decoded.uid });

    if (!admin || !["admin", "manager"].includes(admin.role)) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { userUid, action } = await req.json();

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

      await db.collection("users").updateOne(
        { userId: userUid },
        {
          $inc: {
            walletBalance: creditedUsdAmount,
            topupBalance: creditedUsdAmount,
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

      const user = await db
        .collection("users")
        .findOne({ userId: userUid });

      if (
        user?.referredBy &&
        !user.thresholdRewardGiven &&
        Number(user.topupBalance || 0) >= REQUIRED_TOTAL
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
            reachedAmount: user.topupBalance,
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
