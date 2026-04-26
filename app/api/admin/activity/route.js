import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { requireAuth, requireRoles } from "@/lib/apiGuard";

const toDate = (value) => {
  if (!value) return new Date(0);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const matchesType = (itemType, filterType) => {
  if (filterType === "all") return true;
  return itemType === filterType;
};

const matchesSearch = (item, query) => {
  if (!query) return true;
  const haystack = [
    item.title,
    item.description,
    item.userName,
    item.userId,
    item.status,
    item.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
};

export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const roleAccess = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!roleAccess.ok) return roleAccess.response;

    const { searchParams } = new URL(req.url);
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(50, parsePositiveInt(searchParams.get("limit"), 15));
    const type = (searchParams.get("type") || "all").toLowerCase();
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    const [tickets, payments, withdraws, adRequests, budgetLogs, users] = await Promise.all([
      db.collection("tickets").find({}).sort({ updatedAt: -1 }).limit(300).toArray(),
      db.collection("payments").find({}).sort({ updatedAt: -1 }).limit(300).toArray(),
      db.collection("referral_withdraw_requests").find({}).sort({ updatedAt: -1 }).limit(300).toArray(),
      db.collection("adAccountRequests").find({}).sort({ updatedAt: -1 }).limit(300).toArray(),
      db.collection("ads_spending_limit_logs").find({}).sort({ updatedAt: -1 }).limit(300).toArray(),
      db.collection("users").find({}).sort({ createdAt: -1 }).limit(300).toArray(),
    ]);

    const ticketItems = tickets.map((item) => ({
      id: `ticket-${String(item._id)}`,
      type: "support",
      title: item.subject || "Support Ticket",
      description: `Ticket ${item.ticketId || String(item._id).slice(-6)} updated`,
      status: item.status || "open",
      userId: item.userId || "",
      userName: item.userName || "",
      createdAt: item.updatedAt || item.createdAt,
    }));

    const paymentItems = payments.map((item) => ({
      id: `payment-${String(item._id)}`,
      type: "payment",
      title: item.method === "bank_transfer" ? "Manual Payment Request" : "Payment",
      description: `Amount ${item.amountBdt ?? item.amount ?? 0} ${item.currency || "BDT"}`,
      status: item.status || "pending",
      userId: item.userUid || item.userId || "",
      userName: item.userName || "",
      createdAt: item.updatedAt || item.createdAt,
    }));

    const withdrawItems = withdraws.map((item) => ({
      id: `withdraw-${String(item._id)}`,
      type: "withdraw",
      title: "Affiliate Withdraw Request",
      description: `Amount ${item.amount ?? 0}`,
      status: item.status || "pending",
      userId: item.userId || item.userUid || "",
      userName: item.userName || "",
      createdAt: item.updatedAt || item.createdAt,
    }));

    const adRequestItems = adRequests.map((item) => ({
      id: `adreq-${String(item._id)}`,
      type: "ads",
      title: "Meta Ads Request",
      description: `${item.adAccountName || item.adAccountId || "Ad Account"} budget ${item.monthlyBudget ?? 0}`,
      status: item.status || "pending",
      userId: item.userId || item.userUid || "",
      userName: item.userName || "",
      createdAt: item.updatedAt || item.createdAt,
    }));

    const budgetLogItems = budgetLogs.map((item) => ({
      id: `budget-${String(item._id)}`,
      type: "ads",
      title: "Spending Limit Updated",
      description: `${item.ad_account_id || "Account"} ${item.old_limit ?? 0} -> ${item.new_limit ?? 0}`,
      status: item.approved === false ? "failed" : "success",
      userId: item.user_id || item.userId || "",
      userName: item.userName || "",
      createdAt: item.timestamp || item.updatedAt || item.createdAt,
    }));

    const userItems = users.map((item) => ({
      id: `user-${String(item._id)}`,
      type: "users",
      title: "New User Registration",
      description: item.email || item.phoneNumber || "New account created",
      status: "active",
      userId: item.userId || "",
      userName: item.name || "",
      createdAt: item.createdAt,
    }));

    const merged = [
      ...ticketItems,
      ...paymentItems,
      ...withdrawItems,
      ...adRequestItems,
      ...budgetLogItems,
      ...userItems,
    ]
      .filter((item) => matchesType(item.type, type))
      .filter((item) => matchesSearch(item, query))
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());

    const totalItems = merged.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const data = merged.slice(start, start + limit);

    const counts = {
      all: ticketItems.length + paymentItems.length + withdrawItems.length + adRequestItems.length + budgetLogItems.length + userItems.length,
      support: ticketItems.length,
      payment: paymentItems.length,
      withdraw: withdrawItems.length,
      ads: adRequestItems.length + budgetLogItems.length,
      users: userItems.length,
    };

    return NextResponse.json({
      ok: true,
      data,
      counts,
      pagination: {
        page: safePage,
        limit,
        totalItems,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: safePage < totalPages,
      },
    });
  } catch (error) {
    console.error("Admin activity fetch error:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
