import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await getDB();
    const userUid = decoded.uid || decoded.userId;

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

    return NextResponse.json({ ok: true, data: history });
  } catch (err) {
    console.error("History Fetch Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
