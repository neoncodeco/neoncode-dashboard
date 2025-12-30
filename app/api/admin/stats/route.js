import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

    const { db } = await getDB();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all"; // today, yesterday, 7days, month, all

    // Date Filter Logic
    let dateQuery = {};
    const now = new Date();
    if (range === "today") {
      dateQuery = { createdAt: { $gte: new Date(now.setHours(0,0,0,0)) } };
    } else if (range === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      dateQuery = { createdAt: { $gte: new Date(yesterday.setHours(0,0,0,0)), $lt: new Date(new Date().setHours(0,0,0,0)) } };
    } else if (range === "7days") {
      const sevenDays = new Date(now);
      sevenDays.setDate(sevenDays.getDate() - 7);
      dateQuery = { createdAt: { $gte: sevenDays } };
    } else if (range === "month") {
      const month = new Date(now.getFullYear(), now.getMonth(), 1);
      dateQuery = { createdAt: { $gte: month } };
    }

    const [counts, revenueData, withdrawData, budgetData, limitData, recentUsers, chartStats] = await Promise.all([
      // ১. কাউন্টস (ফিল্টার অনুযায়ী)
      Promise.all([
        db.collection("adAccountRequests").countDocuments(dateQuery),
        db.collection("ads_spending_limit_logs").countDocuments(dateQuery),
        db.collection("payments").countDocuments(dateQuery),
        db.collection("referral_withdraw_requests").countDocuments(dateQuery),
        db.collection("tickets").countDocuments(dateQuery),
        db.collection("users").countDocuments(dateQuery),
      ]),
      // ২. Total Revenue (String to Number Conversion)
      db.collection("payments").aggregate([
        { $match: { status: "approved", ...dateQuery } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
      ]).toArray(),
      // ৩. Total Withdraw
      db.collection("referral_withdraw_requests").aggregate([
        { $match: dateQuery },
        { $group: { _id: null, total: { $sum:"$amount" }  } }
      ]).toArray(),
      // ৪. Total Budget
      db.collection("adAccountRequests").aggregate([
        { $match: dateQuery },
        { $group: { _id: null, total: { $sum: "$monthlyBudget" } } }
      ]).toArray(),
      // ৫. Limit Changes
      db.collection("ads_spending_limit_logs").aggregate([
        { $match: dateQuery },
        { $group: { _id: null, total: { $sum: "$change_amount" } } }
      ]).toArray(),
      // ৬. রিসেন্ট ১০ জন ইউজার
      db.collection("users").find({}).sort({ createdAt: -1 }).limit(10).toArray(),
      // ৭. চার্ট ডাটা
      db.collection("users").aggregate([
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { "_id": 1 } }
      ]).toArray()
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedChartData = monthNames.map((name, i) => ({
      name, users: chartStats.find(s => s._id === i + 1)?.count || 0
    }));

    return NextResponse.json({
      ok: true,
      data: {
        counts: { adAccountRequests: counts[0], spendingLogs: counts[1], payments: counts[2], withdraws: counts[3], tickets: counts[4], users: counts[5] },
        metrics: { totalRevenue: revenueData[0]?.total || 0, totalWithdraw: withdrawData[0]?.total || 0, totalBudget: budgetData[0]?.total || 0, totalLimitChange: limitData[0]?.total || 0 },
        recentUsers,
        chartData: formattedChartData,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}