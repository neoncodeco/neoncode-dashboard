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
    item.userEmail,
    item.userId,
    item.status,
    item.type,
    item.editedByAdmin ? "edited by admin" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
};

function resolveUserId(item) {
  return String(item.userUid || item.userId || item.user_id || "").trim();
}

async function loadUserMap(db, userIds) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return new Map();

  const users = await db
    .collection("users")
    .find({ userId: { $in: unique } }, { projection: { userId: 1, name: 1, email: 1 } })
    .toArray();

  return new Map(users.map((user) => [user.userId, user]));
}

function enrichActivityUser(item, userMap) {
  const user = userMap.get(item.userId);
  const userName = item.userName || user?.name || "";
  const userEmail = item.userEmail || user?.email || "";

  return {
    ...item,
    userName: userName || userEmail || "Unknown",
    userEmail,
  };
}

function paymentWasEditedByAdmin(item) {
  if (item.lastAdminEditAt) return true;
  if (Array.isArray(item.adminEditHistory) && item.adminEditHistory.length > 0) return true;
  return false;
}

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
      db.collection("ads_spending_limit_logs").find({}).sort({ timestamp: -1 }).limit(300).toArray(),
      db.collection("users").find({}).sort({ createdAt: -1 }).limit(300).toArray(),
    ]);

    const ticketItems = tickets.map((item) => ({
      id: `ticket-${String(item._id)}`,
      type: "support",
      title: item.subject || "Support Ticket",
      description: `Ticket ${item.ticketId || String(item._id).slice(-6)} updated`,
      status: item.status || "open",
      userId: resolveUserId(item),
      userName: item.userName || "",
      userEmail: item.userEmail || item.email || "",
      createdAt: item.updatedAt || item.createdAt,
      editedByAdmin: false,
    }));

    const paymentItems = payments.map((item) => {
      const editedByAdmin = paymentWasEditedByAdmin(item);
      return {
        id: `payment-${String(item._id)}`,
        type: "payment",
        title: item.method === "bank_transfer" ? "Manual Payment Request" : "Payment",
        description: `Amount ${item.amountBdt ?? item.amount ?? 0} ${item.currency || "BDT"}`,
        status: item.status || "pending",
        userId: resolveUserId(item),
        userName: item.userName || "",
        userEmail: item.userEmail || item.email || "",
        createdAt: item.updatedAt || item.createdAt,
        editedByAdmin,
        adminEditedAt: item.lastAdminEditAt || null,
      };
    });

    const withdrawItems = withdraws.map((item) => ({
      id: `withdraw-${String(item._id)}`,
      type: "withdraw",
      title: "Affiliate Withdraw Request",
      description: `Amount ${item.amount ?? 0}`,
      status: item.status || "pending",
      userId: resolveUserId(item),
      userName: item.userName || "",
      userEmail: item.userEmail || item.email || "",
      createdAt: item.updatedAt || item.createdAt,
      editedByAdmin: false,
    }));

    const adRequestItems = adRequests.map((item) => ({
      id: `adreq-${String(item._id)}`,
      type: "ads",
      title: "Meta Ads Request",
      description: `${item.accountName || item.adAccountName || item.adAccountId || "Ad Account"} budget ${item.monthlyBudget ?? 0}`,
      status: item.status || "pending",
      userId: resolveUserId(item),
      userName: item.userName || item.accountName || "",
      userEmail: item.userEmail || item.email || "",
      createdAt: item.updatedAt || item.createdAt,
      editedByAdmin: false,
    }));

    const budgetLogItems = budgetLogs.map((item) => ({
      id: `budget-${String(item._id)}`,
      type: "ads",
      title: "Spending Limit Updated",
      description: `${item.ad_account_id || "Account"} ${item.old_limit ?? 0} -> ${item.new_limit ?? 0}`,
      status: item.approved === false ? "failed" : "success",
      userId: resolveUserId(item),
      userName: item.userName || "",
      userEmail: item.userEmail || "",
      createdAt: item.timestamp || item.updatedAt || item.createdAt,
      editedByAdmin: false,
    }));

    const userItems = users.map((item) => ({
      id: `user-${String(item._id)}`,
      type: "users",
      title: "New User Registration",
      description: item.email || item.phoneNumber || "New account created",
      status: item.status || "active",
      userId: item.userId || "",
      userName: item.name || "",
      userEmail: item.email || "",
      createdAt: item.createdAt,
      editedByAdmin: false,
    }));

    const rawItems = [
      ...ticketItems,
      ...paymentItems,
      ...withdrawItems,
      ...adRequestItems,
      ...budgetLogItems,
      ...userItems,
    ];

    const userMap = await loadUserMap(
      db,
      rawItems.map((item) => item.userId)
    );

    const enrichedItems = rawItems.map((item) => enrichActivityUser(item, userMap));

    const merged = enrichedItems
      .filter((item) => matchesType(item.type, type))
      .filter((item) => matchesSearch(item, query))
      .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());

    const totalItems = merged.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const data = merged.slice(start, start + limit);

    const counts = {
      all: enrichedItems.length,
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
