import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ObjectId } from "mongodb";

/* ================= CONFIG ================= */
const REQUIRED_TOTAL = 2000;        // threshold
const ONE_TIME_COMMISSION = 10;     // fixed reward

const LEVEL1_MILESTONES = [
  { count: 10, reward: 50 },
  { count: 25, reward: 150 },
  { count: 50, reward: 400 },
];

/* ================= API ================= */
export async function POST(req) {
  try {
    /* ---------- AUTH ---------- */
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

    if (!admin || admin.role !== "admin" && admin.role !== "manager") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    /* ---------- REQUEST ---------- */
    const { userUid, action } = await req.json();

    if (!userUid || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    /* ---------- FIND PENDING PAYMENT ---------- */
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

    /* ================= APPROVE ================= */
    if (action === "approve") {
      /* 1️⃣ Update user balances */
      await db.collection("users").updateOne(
        { userId: userUid },
        {
          $inc: {
            walletBalance: payment.amount,
            topupBalance: payment.amount,
          },
        }
      );

      /* 2️⃣ Update payment */
      await db.collection("payments").updateOne(
        { _id: payment._id },
        {
          $set: {
            status: "approved",
            updatedAt: new Date(),
          },
        }
      );

      /* 3️⃣ Reload user after balance update */
      const user = await db
        .collection("users")
        .findOne({ userId: userUid });

      /* ================= REFERRAL THRESHOLD LOGIC ================= */
      if (
        user?.referredBy &&
        !user.thresholdRewardGiven &&
        user.topupBalance >= REQUIRED_TOTAL
      ) {
        const referrer = await db
          .collection("users")
          .findOne({ userId: user.referredBy });

        if (referrer) {
          /* 💰 Give one-time commission */
          await db.collection("users").updateOne(
            { userId: referrer.userId },
            {
              $inc: {
                level1DepositCount: 1,
                "referralStats.totalReferIncome": ONE_TIME_COMMISSION,
              },
            }
          );

          /* 🔒 Mark referred user as rewarded */
          await db.collection("users").updateOne(
            { userId: userUid },
            {
              $set: {
                thresholdRewardGiven: true,
              },
            }
          );

          /* 📜 Referral history */
          await db.collection("referral_history").insertOne({
            referrerId: referrer.userId,
            referredUserId: userUid,
            reachedAmount: user.topupBalance,
            reward: ONE_TIME_COMMISSION,
            type: "level1-2000-threshold",
            createdAt: new Date(),
          });

          /* ================= MILESTONE CHECK ================= */
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
        message: "Payment approved & referral processed",
      });
    }

    /* ================= REJECT ================= */
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
    console.error(error);
    return NextResponse.json({
      ok: false,
      error: error.message,
    });
  }
}
