import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

const normalizeText = (value) => (typeof value === "string" ? value.toLowerCase() : "");

const resolveCategory = (item) => {
  const type = normalizeText(item?.type);
  const title = normalizeText(item?.title);
  const fullText = `${type} ${title}`;

  if (fullText.includes("budget") || fullText.includes("limit")) return "budget";
  if (fullText.includes("payment") || fullText.includes("wallet") || fullText.includes("topup")) return "payment";
  if (fullText.includes("support") || fullText.includes("ticket") || fullText.includes("chat")) return "support";
  if (fullText.includes("affiliate") || fullText.includes("referral")) return "affiliate";
  if (fullText.includes("project") || fullText.includes("task")) return "project";
  if (fullText.includes("account") || fullText.includes("profile")) return "account";
  return "other";
};

const PENDING_STATUSES = new Set(["pending", "open"]);
const COMPLETED_STATUSES = new Set(["approved", "active", "success", "completed"]);

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await getDB();
    const userUid = decoded.uid || decoded.userId;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("limit") || "12", 10) || 12));
    const category = (searchParams.get("category") || "all").toLowerCase();

    const [activityHistory, adsLogs, payments] = await Promise.all([
      db
        .collection("otherCollection")
        .find({
          $or: [{ userUid }, { userId: userUid }],
        })
        .toArray(),
      db
        .collection("ads_spending_limit_logs")
        .find({
          $or: [{ user_id: userUid }, { userUid }],
        })
        .toArray(),
      db
        .collection("payments")
        .find({ userUid })
        .toArray(),
    ]);

    const normalizedActivity = activityHistory.map((item) => ({
      ...item,
      _id: `activity-${String(item._id)}`,
      createdAt: item.createdAt || item.updatedAt || new Date(),
      updatedAt: item.updatedAt || item.createdAt || new Date(),
      type: item.type || "ACTIVITY",
      title: item.title || "Activity",
      description: item.description || "",
      status: item.status || "completed",
    }));

    const normalizedAdsLogs = adsLogs.map((item) => ({
      ...item,
      _id: `ads-${String(item._id)}`,
      createdAt: item.timestamp || item.createdAt || new Date(),
      updatedAt: item.timestamp || item.updatedAt || new Date(),
      type: "META_BUDGET_UPDATE",
      title: "Meta Ad Account Budget Updated",
      description: `Account ID: ${item.ad_account_id} | Old: ${Number(item.old_limit || 0)} -> New: ${Number(item.new_limit || 0)}`,
      meta: {
        accountId: item.ad_account_id || "",
        oldLimit: Number(item.old_limit || 0),
        newLimit: Number(item.new_limit || 0),
        changeAmount:
          item.change_amount !== undefined
            ? Number(item.change_amount || 0)
            : Number(item.new_limit || 0) - Number(item.old_limit || 0),
        walletBefore:
          item.wallet_before !== undefined ? Number(item.wallet_before || 0) : null,
        walletAfter:
          item.wallet_after !== undefined ? Number(item.wallet_after || 0) : null,
      },
      status: item.approved === false ? "failed" : "success",
    }));

    const normalizedPayments = payments.map((item) => {
      const amount = Number(item.amountBdt ?? item.amount ?? 0);
      const method = item.method === "bank_transfer" ? "Manual Payment" : "Online Payment";

      return {
        ...item,
        _id: `payment-${String(item._id)}`,
        createdAt: item.createdAt || item.updatedAt || new Date(),
        updatedAt: item.updatedAt || item.createdAt || new Date(),
        type: "PAYMENT",
        title: method,
        description: `Amount: ${amount} ${item.currency || "BDT"}`,
        status: item.status || "pending",
      };
    });

    const history = [...normalizedActivity, ...normalizedAdsLogs, ...normalizedPayments].sort(
      (a, b) =>
        new Date(b.createdAt || b.updatedAt || 0).getTime() -
        new Date(a.createdAt || a.updatedAt || 0).getTime()
    );

    const categoryCounts = {
      all: history.length,
      budget: 0,
      payment: 0,
      support: 0,
      affiliate: 0,
      project: 0,
      account: 0,
      other: 0,
    };

    history.forEach((item) => {
      const itemCategory = resolveCategory(item);
      if (Object.prototype.hasOwnProperty.call(categoryCounts, itemCategory)) {
        categoryCounts[itemCategory] += 1;
      }
    });

    const filteredHistory = category === "all" ? history : history.filter((item) => resolveCategory(item) === category);
    const totalItems = filteredHistory.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const paginatedHistory = filteredHistory.slice(start, start + limit);
    const statusCounts = {
      pending: filteredHistory.filter((item) => PENDING_STATUSES.has(normalizeText(item.status))).length,
      completed: filteredHistory.filter((item) => COMPLETED_STATUSES.has(normalizeText(item.status))).length,
    };

    return NextResponse.json({
      ok: true,
      data: paginatedHistory,
      categoryCounts,
      pagination: {
        page: safePage,
        limit,
        totalItems,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: safePage < totalPages,
      },
      statusCounts,
    });
  } catch (err) {
    console.error("History Fetch Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
