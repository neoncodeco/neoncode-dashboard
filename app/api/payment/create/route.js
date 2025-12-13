import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);

    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { amount, reason } = await req.json();

    const payload = {
      full_name: decoded.email,
      email: decoded.email,
      amount: String(amount),
      metadata: {
        userUid: decoded.uid,
        reason,
      },
      redirect_url: process.env.UDDOKTAPAY_REDIRECT,
      cancel_url: process.env.UDDOKTAPAY_CANCEL,
      webhook_url: process.env.UDDOKTAPAY_WEBHOOK,
    };

    const res = await fetch(process.env.UDDOKTAPAY_BASE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "RT-UDDOKTAPAY-API-KEY": process.env.UDDOKTAPAY_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.payment_url) {
      return NextResponse.json({ ok: false, data }, { status: 400 });
    }

    const { db } = await getDB();
    await db.collection("payments").insertOne({
      trx_id: data.transaction_id,
      userUid: decoded.uid,
      email: decoded.email,
      method: "uddoktapay",
      amount,
      reason,
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      paymentUrl: data.payment_url,
      trx_id: data.transaction_id,
    });

  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
