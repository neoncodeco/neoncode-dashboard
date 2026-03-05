import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import getDB from "@/lib/mongodb";

export async function GET(req) {
  try {
    // 🔐 Verify user
    const user = await verifyToken(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 🔎 Query param
    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get("ad_account_id");

    if (!adAccountId)
      return NextResponse.json(
        { error: "ad_account_id required" },
        { status: 400 }
      );

    const cleanAdAccountId = String(adAccountId).replace(/^act_/, "").trim();
    if (!/^\d+$/.test(cleanAdAccountId)) {
      return NextResponse.json(
        { error: "Invalid ad_account_id format" },
        { status: 400 }
      );
    }

    // 🟢 Load System Token from DB
    const { db } = await getDB();
    const setting = await db
      .collection("settings")
      .findOne({ key: "FB_SYS_TOKEN" });

    if (!setting?.value) {
      return NextResponse.json(
        { error: "Facebook system token not configured" },
        { status: 400 }
      );
    }

    const FB_SYS_TOKEN = setting.value;

    // 🌐 Facebook API Call
    const fbRes = await fetch(
      `https://graph.facebook.com/v18.0/act_${cleanAdAccountId}?fields=spend_cap,amount_spent,account_status`,
      {
        headers: {
          Authorization: `Bearer ${FB_SYS_TOKEN}`, // ✅ DB token
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
    console.error("FB API ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
