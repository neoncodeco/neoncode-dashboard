import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import getDB from "@/lib/mongodb";
import { ensureWritableUser } from "@/lib/userAccess";

export async function POST(req) {
  try {
    const { db } = await getDB();

    // 🔐 Verify User
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ad_account_id, old_limit, new_limit } = await req.json();

    if (!ad_account_id || new_limit === undefined || old_limit === undefined) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const oldLimit = Number(old_limit);
    const newLimit = Number(new_limit);

    // 🧮 Difference
    const diff = newLimit - oldLimit;

    const access = await ensureWritableUser(db, user.uid);
    if (!access.ok) {
      return access.response;
    }

    // 👤 Fetch user
    const userData = await db.collection("users").findOne({
      userId: user.uid,
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const walletBalance = Number(userData.walletBalance || 0);

    // ❌ Wallet check (only increase)
    if (diff > 0 && walletBalance < diff) {
      return NextResponse.json(
        { error: "Insufficient wallet balance. Please top up first." },
        { status: 400 }
      );
    }

    /* ===============================
       🔑 LOAD FB SYSTEM TOKEN FROM DB
       =============================== */
    const setting = await db
      .collection("settings")
      .findOne({ key: "FB_SYS_TOKEN" });

    if (!setting?.value) {
      return NextResponse.json(
        { error: "Facebook system token not configured" },
        { status: 500 }
      );
    }

    const FB_SYS_TOKEN = setting.value;

    /* ===============================
       🌐 FACEBOOK API CALL
       =============================== */

    // Facebook expects TOTAL spend cap (sub-units not needed here)
    const spendCap = Math.round(newLimit);

    const fbRes = await fetch(
      `https://graph.facebook.com/v18.0/act_${ad_account_id}`,
      {
        method: "POST",
        body: new URLSearchParams({
          access_token: FB_SYS_TOKEN, // ✅ FROM DB
          spend_cap: spendCap.toString(),
        }),
      }
    );

    const fbResult = await fbRes.json();

    if (fbResult.error) {
      return NextResponse.json(
        { error: fbResult.error.message },
        { status: 400 }
      );
    }

    /* ===============================
       💰 WALLET UPDATE
       =============================== */
    if (diff > 0) {
      await db.collection("users").updateOne(
        { userId: user.uid },
        { $inc: { walletBalance: -diff } }
      );
    }

    /* ===============================
       🧾 LOG TRANSACTION
       =============================== */
    await db.collection("ads_spending_limit_logs").insertOne({
      user_id: user.uid,
      ad_account_id,
      old_limit: oldLimit,
      new_limit: newLimit,
      change_amount: diff,
      wallet_before: walletBalance,
      wallet_after: diff > 0 ? walletBalance - diff : walletBalance,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Spending limit updated",
      new_limit: newLimit,
    });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
