import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { ObjectId } from "mongodb";

const REFERRAL_PERCENT = 5;

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
    const adminUser = await db
      .collection("users")
      .findOne({ userId: decoded.uid });

    if (!adminUser || adminUser.role !== "admin") {
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
        error: "No pending payment",
      });
    }

    /* ================= APPROVE ================= */
    if (action === "approve") {
      // 1️⃣ Update user balance
      await db.collection("users").updateOne(
        { userId: userUid },
        {
          $inc: {
            topupBalance: payment.amount,
            walletBalance: payment.amount,
          },
        }
      );

      // 2️⃣ Update payment status
      await db.collection("payments").updateOne(
        { _id: payment._id },
        { $set: { status: "approved", updatedAt: new Date() } }
      );

      // 3️⃣ REFERRAL COMMISSION
      const user = await db
        .collection("users")
        .findOne({ userId: userUid });

      if (user?.referredBy) {
        const referrer = await db
          .collection("users")
          .findOne({ userId: user.referredBy });

        if (referrer) {
          const commission =
            (payment.amount * REFERRAL_PERCENT) / 100;

          // 💰 add commission
          await db.collection("users").updateOne(
            { userId: referrer.userId },
            {
              $inc: {
                walletBalance: commission,
                "referralStats.totalReferIncome": commission,
              },
            }
          );

          // 📜 save referral history
          await db.collection("referral_history").insertOne({
            referrerId: referrer.userId,
            referredUserId: userUid,
            topupId: new ObjectId(payment._id),
            topupAmount: payment.amount,
            commissionPercent: REFERRAL_PERCENT,
            commissionAmount: commission,
            createdAt: new Date(),
          });
        }
      }

      return NextResponse.json({
        ok: true,
        message: "Payment approved & commission added",
      });
    }

    /* ================= REJECT ================= */
    await db.collection("payments").updateOne(
      { _id: payment._id },
      { $set: { status: "rejected", updatedAt: new Date() } }
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
