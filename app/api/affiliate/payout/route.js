import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";


function validateAccount(method, account) {
  if (!account) return "Account info required";

  if (method === "bkash" || method === "nagad") {
    if (!account.number) return "Wallet number required";
  }

  if (method === "bank") {
    const { bankName, accountName, accountNo } = account;
    if (!bankName || !accountName || !accountNo)
      return "Incomplete bank information";
  }

  if (method === "crypto") {
    const { network, address } = account;
    if (!network || !address)
      return "Crypto network and address required";
  }

  return null;
}

export async function POST(req) {
  try {
    /* ---------- AUTH ---------- */
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /* ---------- BODY ---------- */
    const { amount, method, account, saveMethod } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const allowedMethods = ["bkash", "nagad", "bank", "crypto"];
    if (!allowedMethods.includes(method)) {
      return NextResponse.json({ error: "Invalid payout method" }, { status: 400 });
    }

    const accountError = validateAccount(method, account);
    if (accountError) {
      return NextResponse.json({ error: accountError }, { status: 400 });
    }

    /* ---------- DB ---------- */
    const { db } = await getDB();



    const user = await db
      .collection("users")
      .findOne({ userId: decoded.uid });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    /* ---------- BALANCE CHECK ---------- */
    const withdrawable =
      (user.referralStats?.totalReferIncome || 0) -
      (user.referralStats?.totalPayout || 0);

    if (amount > withdrawable) {
      return NextResponse.json(
        { error: "Insufficient referral balance" },
        { status: 400 }
      );
    }

    /* ---------- SAVE PAYOUT METHOD (OPTIONAL) ---------- */
    if (saveMethod === true) {
      let savePayload = {};

      if (method === "bkash" || method === "nagad") {
        savePayload = { number: account.number };
      } else {
        savePayload = account;
      }

      await db.collection("users").updateOne(
        { userId: decoded.uid },
        {
          $set: {
            [`payoutMethods.${method}`]: savePayload,
            updatedAt: new Date(),
          },
        }
      );
    }

    /* ---------- CREATE WITHDRAW REQUEST ---------- */
    await db.collection("referral_withdraw_requests").insertOne({
      userId: decoded.uid,
      userName: user.name,
      userEmail: user.email,
      amount,
      method,
      account,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      message: "Referral withdraw request submitted",
    });
  } catch (err) {
    console.error("Withdraw error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
