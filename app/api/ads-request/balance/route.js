import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import getDB from "@/lib/mongodb";

export async function GET(req) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get("ad_account_id");

    if (!adAccountId) {
      return NextResponse.json({ error: "ad_account_id required" }, { status: 400 });
    }

    const cleanAdAccountId = String(adAccountId).replace(/^act_/, "").trim();
    if (!/^\d+$/.test(cleanAdAccountId)) {
      return NextResponse.json({ error: "Invalid ad_account_id format" }, { status: 400 });
    }

    const { db } = await getDB();
    const setting = await db.collection("settings").findOne({ key: "FB_SYS_TOKEN" });

    if (!setting?.value) {
      return NextResponse.json(
        { error: "Facebook system token not configured" },
        { status: 400 }
      );
    }

    const graphParams = new URLSearchParams({
      access_token: setting.value,
      fields: "spend_cap,amount_spent,account_status,currency",
    });

    const fbRes = await fetch(
      `https://graph.facebook.com/v18.0/act_${cleanAdAccountId}?${graphParams.toString()}`,
      {
        cache: "no-store",
      }
    );

    const fbData = await fbRes.json();

    if (!fbRes.ok || fbData?.error) {
      const metaError = fbData?.error || {};
      return NextResponse.json(
        {
          error:
            metaError.message ||
            "Meta Ads balance lookup failed. Check token permissions and ad account access.",
          meta_code: metaError.code || null,
          meta_subcode: metaError.error_subcode || null,
        },
        { status: fbRes.status || 400 }
      );
    }

    const spendCap = Number(fbData.spend_cap || 0) / 100;
    const amountSpent = Number(fbData.amount_spent || 0) / 100;
    const remaining = spendCap - amountSpent;

    return NextResponse.json({
      spendCap,
      amountSpent,
      remaining,
      status: fbData.account_status,
      currency: fbData.currency || "USD",
    });
  } catch (err) {
    console.error("FB API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
