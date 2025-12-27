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

    // ১. পেমেন্ট রেকর্ডটি ডাটাবেজ থেকে খুঁজে বের করা
    const paymentDoc = await db.collection("payments").findOne({ trx_id });

    if (!paymentDoc) {
      console.error(`Payment record not found for trx_id: ${trx_id}`);
      return NextResponse.json({ ok: false, error: "Record not found" }, { status: 404 });
    }

    // ২. যদি পেমেন্ট অলরেডি 'paid' হয়ে থাকে, তবে আবার প্রসেস করার দরকার নেই (Double Credit Protection)
    if (paymentDoc.status === "paid") {
      return NextResponse.json({ ok: true, message: "Already processed" });
    }

    // ৩. PAYMENTLY (UddoktaPay v2) থেকে পেমেন্ট ভেরিফাই করা
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

    // ৪. পেমেন্ট স্ট্যাটাস চেক (COMPLETED কিনা)
    if (
      verifyData?.success === true &&
      verifyData?.payment?.status === "COMPLETED"
    ) {
      // ৫. ইউজারের ব্যালেন্স আপডেট করা (শুধুমাত্র একবার হবে)
      if (paymentDoc.userUid) {
        const amount = Number(paymentDoc.amount) || 0;
        
        // ট্রানজেকশন সেফটি নিশ্চিত করতে আপডেট করা
        const userUpdate = await db.collection("users").updateOne(
          { uid: paymentDoc.userUid },
          {
            $inc: { balance: amount },
          }
        );

        console.log(`Balance added: ${amount} to User: ${paymentDoc.userUid}`);
      }

      // ৬. পেমেন্ট স্ট্যাটাস 'paid' হিসেবে আপডেট করা
      await db.collection("payments").updateOne(
        { trx_id },
        {
          $set: {
            status: "paid",
            verifyResponse: verifyData,
            callbackData: body,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({ ok: true, status: "paid" });
    } else {
      // পেমেন্ট ফেইল হলে বা কমপ্লিট না হলে
      await db.collection("payments").updateOne(
        { trx_id },
        {
          $set: {
            status: "failed",
            verifyResponse: verifyData,
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ ok: true, status: "failed" });
    }

  } catch (error) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}