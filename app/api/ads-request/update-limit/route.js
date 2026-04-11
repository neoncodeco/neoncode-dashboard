import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import getDB from "@/lib/mongodb";
import { ensureWritableUser } from "@/lib/userAccess";
import { normalizeAdAccountId, resolveMetaAccessTokens } from "@/lib/metaAdsAccess";
import { parseIntegerAmount } from "@/lib/wholeAmount";

export async function POST(req) {
  try {
    const { db } = await getDB();

    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ad_account_id, old_limit, new_limit } = await req.json();

    if (!ad_account_id || new_limit === undefined || old_limit === undefined) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const cleanAdAccountId = normalizeAdAccountId(ad_account_id);
    if (!/^\d+$/.test(cleanAdAccountId)) {
      return NextResponse.json({ error: "Invalid ad account ID" }, { status: 400 });
    }

    const oldLimit = parseIntegerAmount(old_limit, { allowZero: true });
    const newLimit = parseIntegerAmount(new_limit, { allowZero: true });

    if (oldLimit === null || newLimit === null) {
      return NextResponse.json({ error: "Limits must be whole numbers" }, { status: 400 });
    }

    const diff = newLimit - oldLimit;

    const access = await ensureWritableUser(db, user.uid);
    if (!access.ok) {
      return access.response;
    }

    const userData = await db.collection("users").findOne({
      userId: user.uid,
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const walletBalance = Number(userData.walletBalance || 0);
    if (diff > 0 && walletBalance < diff) {
      return NextResponse.json(
        { error: "Insufficient wallet balance. Please top up first." },
        { status: 400 }
      );
    }

    const { tokens } = await resolveMetaAccessTokens(db, cleanAdAccountId);
    if (!tokens.length) {
      return NextResponse.json(
        { error: "Facebook access token not configured" },
        { status: 500 }
      );
    }

    const spendCap = Math.round(newLimit);
    let fbResult = null;

    for (const candidate of tokens) {
      const fbRes = await fetch(`https://graph.facebook.com/v18.0/act_${cleanAdAccountId}`, {
        method: "POST",
        body: new URLSearchParams({
          access_token: candidate.token,
          spend_cap: spendCap.toString(),
        }),
      });

      fbResult = await fbRes.json();

      if (fbRes.ok && !fbResult?.error) {
        break;
      }
    }

    if (fbResult?.error) {
      return NextResponse.json(
        { error: fbResult.error.message },
        { status: 400 }
      );
    }

    if (diff > 0) {
      await db.collection("users").updateOne(
        { userId: user.uid },
        { $inc: { walletBalance: -diff } }
      );
    }

    await db.collection("ads_spending_limit_logs").insertOne({
      user_id: user.uid,
      ad_account_id: cleanAdAccountId,
      old_limit: oldLimit,
      new_limit: newLimit,
      change_amount: diff,
      wallet_before: walletBalance,
      wallet_after: diff > 0 ? walletBalance - diff : walletBalance,
      timestamp: new Date(),
    });

    await db.collection("otherCollection").insertOne({
      userUid: user.uid,
      type: "LIMIT_CHANGE",
      title: "Meta Ad Spending Limit Updated",
      description: `Account ID: ${cleanAdAccountId} | Old: ${oldLimit} -> New: ${newLimit}`,
      status: "success",
      createdAt: new Date(),
      updatedAt: new Date(),
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
