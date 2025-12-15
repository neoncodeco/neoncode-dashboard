
import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get("ad_account_id");

    if (!adAccountId)
      return NextResponse.json(
        { error: "ad_account_id required" },
        { status: 400 }
      );

    const fbRes = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}?fields=spend_cap,amount_spent,account_status`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FB_SYS_TOKEN}`,
        },
      }
    );

    const fbData = await fbRes.json();

    if (fbData.error) {
      return NextResponse.json(
        { error: fbData.error.message },
        { status: 400 }
      );
    }

    // 🔄 Convert sub-units → normal currency
    const spendCap = (fbData.spend_cap || 0) / 100;
    const amountSpent = (fbData.amount_spent || 0) / 100;
    const remaining = spendCap - amountSpent;

    return NextResponse.json({
      spendCap,
      amountSpent,
      remaining,
      status: fbData.account_status,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
