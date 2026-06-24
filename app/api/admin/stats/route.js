import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { computeTotalAdAccountAvailableBalance } from "@/lib/metaAccountBalance";
import { formatBdt, formatUsd } from "@/lib/currency";
import { serializeMongoId } from "@/lib/serializeMongoId";

async function buildPendingOverview(db) {
  const [pendingPayments, pendingAdRequests, pendingUsers, paymentCount, adRequestCount, userApprovalCount] =
    await Promise.all([
      db
        .collection("payments")
        .find({ status: "pending" })
        .sort({ createdAt: -1 })
        .limit(15)
        .toArray(),
      db
        .collection("adAccountRequests")
        .find({ status: { $regex: /^pending$/i } })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
      db
        .collection("users")
        .find({ status: { $regex: /^pending$/i } })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
      db.collection("payments").countDocuments({ status: "pending" }),
      db.collection("adAccountRequests").countDocuments({ status: { $regex: /^pending$/i } }),
      db.collection("users").countDocuments({ status: { $regex: /^pending$/i } }),
    ]);

  const paymentUserIds = [...new Set(pendingPayments.map((item) => item.userUid).filter(Boolean))];
  const adUserIds = [...new Set(pendingAdRequests.map((item) => item.userUid || item.userId).filter(Boolean))];
  const lookupIds = [...new Set([...paymentUserIds, ...adUserIds])];

  const relatedUsers = lookupIds.length
    ? await db
        .collection("users")
        .find({ userId: { $in: lookupIds } }, { projection: { userId: 1, name: 1, email: 1 } })
        .toArray()
    : [];
  const userMap = new Map(relatedUsers.map((user) => [user.userId, user]));

  const paymentItems = pendingPayments.map((payment) => {
    const user = userMap.get(payment.userUid);
    const amountBdt = Number(payment.amountBdt ?? payment.amount ?? 0);
    const creditedUsd = Number(payment.creditedUsdAmount || 0);
    return {
      id: `payment-${serializeMongoId(payment._id)}`,
      type: "payment",
      title: user?.name || payment.userName || payment.userEmail || "Payment request",
      subtitle: payment.userEmail || user?.email || payment.method || "Awaiting approval",
      amountLabel: amountBdt > 0 ? formatBdt(amountBdt) : formatUsd(creditedUsd),
      amountSecondary: creditedUsd > 0 && amountBdt > 0 ? formatUsd(creditedUsd) : null,
      createdAt: payment.createdAt || payment.updatedAt || null,
      href: "/admin-dashboard/transactions",
    };
  });

  const adItems = pendingAdRequests.map((request) => {
    const uid = request.userUid || request.userId;
    const user = userMap.get(uid);
    return {
      id: `ad-${serializeMongoId(request._id)}`,
      type: "ad_request",
      title: request.accountName || "Ad account request",
      subtitle: user?.name || request.userEmail || user?.email || "Pending review",
      amountLabel: request.monthlyBudget != null ? formatUsd(request.monthlyBudget) : "—",
      amountSecondary: "Monthly budget",
      createdAt: request.createdAt || request.updatedAt || null,
      href: `/admin-dashboard/meta-ads/${encodeURIComponent(serializeMongoId(request._id))}`,
    };
  });

  const userItems = pendingUsers.map((user) => ({
    id: `user-${user.userId}`,
    type: "user_approval",
    title: user.name || "New user",
    subtitle: user.email || "Pending account approval",
    amountLabel: "Review",
    amountSecondary: user.role || "user",
    createdAt: user.createdAt || null,
    href: "/admin-dashboard/user-approvals",
  }));

  const items = [...paymentItems, ...adItems, ...userItems]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 20);

  return {
    total: paymentCount + adRequestCount + userApprovalCount,
    counts: {
      payments: paymentCount,
      adRequests: adRequestCount,
      userApprovals: userApprovalCount,
    },
    items,
  };
}

async function buildUserFundsSummary(db) {
  const [aggregate, userCount] = await Promise.all([
    db
      .collection("users")
      .aggregate([
        {
          $match: {
            role: { $not: { $regex: /^admin$/i } },
          },
        },
        {
          $project: {
            topup: { $toDouble: { $ifNull: ["$topupBalance", 0] } },
            wallet: { $toDouble: { $ifNull: ["$walletBalance", 0] } },
            used: {
              $max: [
                0,
                {
                  $subtract: [
                    { $toDouble: { $ifNull: ["$topupBalance", 0] } },
                    { $toDouble: { $ifNull: ["$walletBalance", 0] } },
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalTopup: { $sum: "$topup" },
            totalRemaining: { $sum: "$wallet" },
            totalUsed: { $sum: "$used" },
          },
        },
      ])
      .toArray(),
    db.collection("users").countDocuments({ role: { $not: { $regex: /^admin$/i } } }),
  ]);

  const summary = aggregate[0] || {};
  return {
    totalTopup: Math.round(Number(summary.totalTopup || 0) * 100) / 100,
    totalUsed: Math.round(Number(summary.totalUsed || 0) * 100) / 100,
    totalRemaining: Math.round(Number(summary.totalRemaining || 0) * 100) / 100,
    userCount,
  };
}

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

    const [counts, revenueData, withdrawData, budgetData, limitData, adBalanceData, recentUsers, chartStats, userFunds, pendingOverview] = await Promise.all([
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
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $toDouble: { $ifNull: ["$amountBdt", "$amount"] },
              },
            },
          },
        }
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
      computeTotalAdAccountAvailableBalance(db),
      // ৬. রিসেন্ট ১০ জন ইউজার
      db.collection("users").find({}).sort({ createdAt: -1 }).limit(10).toArray(),
      // ৭. চার্ট ডাটা
      db.collection("users").aggregate([
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { "_id": 1 } }
      ]).toArray(),
      buildUserFundsSummary(db),
      buildPendingOverview(db),
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedChartData = monthNames.map((name, i) => ({
      name, users: chartStats.find(s => s._id === i + 1)?.count || 0
    }));

    return NextResponse.json({
      ok: true,
      data: {
        counts: { adAccountRequests: counts[0], spendingLogs: counts[1], payments: counts[2], withdraws: counts[3], tickets: counts[4], users: counts[5] },
        metrics: {
          totalRevenue: revenueData[0]?.total || 0,
          totalWithdraw: withdrawData[0]?.total || 0,
          totalBudget: budgetData[0]?.total || 0,
          totalLimitChange: limitData[0]?.total || 0,
          totalAvailableBalance: adBalanceData?.totalAvailableBalance || 0,
          liveAdAccountCount: adBalanceData?.liveAccountCount || 0,
          mappedAdAccountCount: adBalanceData?.mappedAccountCount || 0,
        },
        userFunds,
        pendingOverview,
        recentUsers,
        chartData: formattedChartData,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
