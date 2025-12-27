import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import crypto from "crypto"; // র‍্যান্ডম আইডি তৈরির জন্য

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { amount, reason } = await req.json();

    // ১. একটি ইউনিক ট্র্যাকিং আইডি তৈরি করুন (এটিই আপনার trx_id হবে)
    const trackingId = crypto.randomBytes(12).toString("hex");

    // ২. পেলোড তৈরি করুন এবং cancel_url এর সাথে trackingId যোগ করুন
    const payload = {
      full_name: decoded.email,
      email: decoded.email,
      amount: String(amount),
      metadata: { userUid: decoded.uid, reason },
      redirect_url: `${process.env.UDDOKTAPAY_REDIRECT}?invoice_id=${trackingId}`,
      cancel_url: `${process.env.UDDOKTAPAY_CANCEL}?invoice_id=${trackingId}`,
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

    if (data.status && data.payment_url) {
      const { db } = await getDB();
      
      // ৩. ডাটাবেজে আমাদের তৈরি করা trackingId দিয়ে সেভ করুন
      await db.collection("payments").insertOne({
        trx_id: trackingId, // গেটওয়ের আইডির বদলে আমাদের জেনারেট করা আইডি
        userUid: decoded.uid,
        email: decoded.email,
        method: "uddoktapay",
        amount: amount,
        reason: reason,
        status: "pending",
        createdAt: new Date(),
      });

      return NextResponse.json({
        ok: true,
        paymentUrl: data.payment_url,
        trx_id: trackingId,
      });
    }

    return NextResponse.json({ ok: false, data }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}