import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";

export async function POST(req) {
  try {
    const body = await req.json();
    const { trx_id } = body;

    if (!trx_id) {
      return NextResponse.json(
        { ok: false, error: "trx_id missing in callback" },
        { status: 400 }
      );
    }

    const { db } = await getDB();

    // 1) Save callback data first
    await db.collection("payments").updateOne(
      { trx_id },
      {
        $set: {
          callbackReceived: true,
          callbackData: body,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // 2) VERIFY PAYMENT FROM PAYMENTLY (UddoktaPay v2)
    const verifyRes = await fetch(
      "https://gorilladigital.paymently.io/api/verify-payment",
      {
        method: "POST",
        headers: {
          "RT-UDDOKTAPAY-API-KEY": process.env.UDDOKTAPAY_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_id: trx_id,
        }),
      }
    );

    const verifyData = await verifyRes.json();

    // 3) Payment status check
    let finalStatus = "failed";

    if (
      verifyData?.success === true &&
      verifyData?.payment?.status === "COMPLETED"
    ) {
      finalStatus = "paid";

      // 4) Update user balance
      const paymentDoc = await db.collection("payments").findOne({ trx_id });
      if (paymentDoc && paymentDoc.userUid) {
        const amount = Number(paymentDoc.amount) || 0;
        await db.collection("users").updateOne(
          { uid: paymentDoc.userUid }, // userUid অনুযায়ী match
          {
            $inc: {
              balance: amount,
            },
          }
        );
      }
    }

    // 5) Update DB payment status
    await db.collection("payments").updateOne(
      { trx_id },
      {
        $set: {
          status: finalStatus,
          verifyResponse: verifyData,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ ok: true, status: finalStatus });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
