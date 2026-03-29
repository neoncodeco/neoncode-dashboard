import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await getDB();
    const admin = await db.collection("users").findOne({ userId: decoded.uid });

    if (!admin || (admin.role !== "admin" && admin.role !== "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* ============================================================
       ১. সেটিংস থেকে সব BM Configuration লোড করা
       ============================================================ */
    const settingDoc = await db.collection("settings").findOne({ key: "FB_BM_CONFIGS" });
    const allBMs = settingDoc?.value || [];

    if (allBMs.length === 0) {
      return NextResponse.json({ error: "No BM tokens configured in settings." }, { status: 400 });
    }

    let totalSynced = 0;
    const allFetchedAccounts = [];

    /* ============================================================
       ২. প্রতিটি BM এর উপর লুপ চালিয়ে অ্যাকাউন্টগুলো ফেচ করা
       ============================================================ */
    for (const bm of allBMs) {
      const { businessId, token, bmName } = bm;
      
      try {
        // Facebook API call to get all ad accounts under this BM
        const fbRes = await fetch(
          `https://graph.facebook.com/v21.0/${businessId}/adaccounts?fields=name,account_id,id,currency,timezone_name,account_status,spend_cap,amount_spent&limit=200&access_token=${token}`
        );

        const data = await fbRes.json();

        if (data.error) {
          console.error(`Error fetching BM ${bmName}:`, data.error.message);
          continue; // কোনো একটা BM এ এরর হলে সেটা স্কিপ করে পরেরটা চেক করবে
        }

        if (data.data && Array.isArray(data.data)) {
          const accounts = data.data.map(acc => ({
            accountId: acc.id, // e.g. act_12345
            accountName: acc.name,
            businessId: businessId, // 👈 এটাই সবচেয়ে জরুরি (BM ID ম্যাপিং)
            bmName: bmName,
            currency: acc.currency,
            status: acc.account_status,
            spendCap: acc.spend_cap,
            amountSpent: acc.amount_spent,
            updatedAt: new Date()
          }));

          allFetchedAccounts.push(...accounts);
        }
      } catch (err) {
        console.error(`Request failed for BM ${bmName}:`, err);
      }
    }

    /* ============================================================
       ৩. ডাটাবেসে Bulk Update/Upsert করা
       ============================================================ */
    if (allFetchedAccounts.length > 0) {
      const bulkOps = allFetchedAccounts.map(acc => ({
        updateOne: {
          filter: { accountId: acc.accountId },
          update: { $set: acc },
          upsert: true
        }
      }));

      const result = await db.collection("ad_accounts").bulkWrite(bulkOps);
      totalSynced = result.upsertedCount + result.modifiedCount;
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully synced ${allFetchedAccounts.length} accounts from ${allBMs.length} BMs.`,
      details: {
        totalFound: allFetchedAccounts.length,
        dbUpdated: totalSynced
      }
    });

  } catch (err) {
    console.error("Sync API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}