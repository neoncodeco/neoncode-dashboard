import { NextResponse } from "next/server";
import getDB from "@/lib/mongodb";
import { requireAuth, requireRoles } from "@/lib/apiGuard";
import { expandAdAccountRequests } from "@/lib/adAccountRequests";
import { formatPaymentDescription } from "@/lib/displayFormatters";
import { normalizeAdAccountId, resolveMetaAccessTokens } from "@/lib/metaAdsAccess";
import { serializeMongoId } from "@/lib/serializeMongoId";

async function fetchMetaSpend(db, adAccountId) {
  const cleanId = normalizeAdAccountId(adAccountId);
  if (!cleanId || !/^\d+$/.test(cleanId)) return null;

  try {
    const { tokens } = await resolveMetaAccessTokens(db, cleanId);
    if (!tokens.length) return null;

    for (const candidate of tokens) {
      const graphParams = new URLSearchParams({
        access_token: candidate.token,
        fields: "spend_cap,amount_spent,account_status,currency",
      });

      const fbRes = await fetch(
        `https://graph.facebook.com/v18.0/act_${cleanId}?${graphParams.toString()}`,
        { cache: "no-store" }
      );
      const fbData = await fbRes.json();
      if (fbRes.ok && !fbData?.error) {
        const spendCap = Number(fbData.spend_cap || 0) / 100;
        const amountSpent = Number(fbData.amount_spent || 0) / 100;
        return {
          spendCap,
          amountSpent,
          remaining: spendCap - amountSpent,
          currency: fbData.currency || "USD",
          accountStatus: fbData.account_status,
        };
      }
    }
  } catch {
    /* ignore per-account meta errors */
  }
  return null;
}

function normalizeActivityItem(item, prefix) {
  return {
    id: `${prefix}-${serializeMongoId(item._id)}`,
    createdAt: item.createdAt || item.updatedAt || item.timestamp || new Date(),
    type: item.type || (prefix === "payment" ? "PAYMENT" : prefix === "ads" ? "META_BUDGET_UPDATE" : "ACTIVITY"),
    title:
      item.title ||
      (prefix === "payment"
        ? formatPaymentDescription(item.method)
        : prefix === "ads"
          ? "Meta Ad Account Budget Updated"
          : "Activity"),
    description:
      item.description ||
      (prefix === "payment"
        ? `Amount: ${Number(item.amountBdt ?? item.amount ?? 0)} ${item.currency || "BDT"}`
        : prefix === "ads"
          ? `Account ID: ${item.ad_account_id} | Old: ${Number(item.old_limit || 0)} → New: ${Number(item.new_limit || 0)}`
          : ""),
    status: item.status || (prefix === "payment" ? "pending" : "completed"),
  };
}

export async function GET(req, { params }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { db } = await getDB();
    const access = await requireRoles(db, auth.decoded.uid, ["admin", "manager"]);
    if (!access.ok) return access.response;

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "User ID required" }, { status: 400 });
    }

    const user = await db.collection("users").findOne({ userId }, { projection: { password: 0 } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const userMatch = {
      $or: [{ userUid: userId }, { userId: userId }, { userEmail: user.email || "" }],
    };

    const [rawRequests, adsLogs, payments, activityHistory] = await Promise.all([
      db.collection("adAccountRequests").find(userMatch).sort({ createdAt: -1 }).toArray(),
      db
        .collection("ads_spending_limit_logs")
        .find({ $or: [{ user_id: userId }, { userUid: userId }] })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray(),
      db.collection("payments").find({ userUid: userId }).sort({ createdAt: -1 }).limit(50).toArray(),
      db
        .collection("otherCollection")
        .find({ $or: [{ userUid: userId }, { userId: userId }] })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),
    ]);

    const expanded = expandAdAccountRequests(rawRequests);
    const activeAccounts = expanded.filter(
      (a) => String(a.status || a.parentStatus || "").toLowerCase() !== "cancelled"
    );

    const uniqueMetaIds = [
      ...new Set(
        activeAccounts
          .map((a) => normalizeAdAccountId(a.MetaAccountID))
          .filter((id) => id && /^\d+$/.test(id))
      ),
    ].slice(0, 20);

    const metaSpendEntries = await Promise.all(
      uniqueMetaIds.map(async (id) => [id, await fetchMetaSpend(db, id)])
    );
    const metaSpendMap = Object.fromEntries(metaSpendEntries);

    const logSpendByAccount = {};
    for (const log of adsLogs) {
      const key = normalizeAdAccountId(log.ad_account_id) || String(log.ad_account_id || "");
      if (!key) continue;
      if (!logSpendByAccount[key]) {
        logSpendByAccount[key] = { budgetChanges: 0, latestLimit: null };
      }
      const change =
        log.change_amount !== undefined
          ? Number(log.change_amount || 0)
          : Number(log.new_limit || 0) - Number(log.old_limit || 0);
      if (change > 0) logSpendByAccount[key].budgetChanges += change;
      if (log.new_limit != null) logSpendByAccount[key].latestLimit = Number(log.new_limit);
    }

    const adAccounts = activeAccounts.map((account) => {
      const metaId = normalizeAdAccountId(account.MetaAccountID);
      const meta = metaId ? metaSpendMap[metaId] : null;
      const logs = metaId ? logSpendByAccount[metaId] : null;

      return {
        id: serializeMongoId(account._id),
        parentRequestId: serializeMongoId(account.parentRequestId || account._id),
        accountName: account.accountName || "Ad Account",
        bmId: account.bmId || "",
        MetaAccountID: account.MetaAccountID || "",
        status: account.status || account.parentStatus || "pending",
        monthlyBudget: Number(account.monthlyBudget || 0),
        amountSpent: meta?.amountSpent ?? null,
        spendCap: meta?.spendCap ?? logs?.latestLimit ?? null,
        remaining: meta?.remaining ?? null,
        budgetChanges: logs?.budgetChanges ?? 0,
        currency: meta?.currency || "USD",
        createdAt: account.createdAt || null,
      };
    });

    const totalSpent = adAccounts.reduce((sum, a) => sum + (Number(a.amountSpent) || 0), 0);

    const transactions = payments.map((p) => ({
      id: serializeMongoId(p._id),
      amountBdt: Number(p.amountBdt ?? p.amount ?? 0),
      amountUsd: Number(p.amountUsd ?? 0),
      currency: p.currency || "BDT",
      method: p.method || "online",
      status: p.status || "pending",
      createdAt: p.createdAt || p.updatedAt || null,
      trxId: p.trxId || p.transactionId || "",
    }));

    const activities = [
      ...activityHistory.map((item) => normalizeActivityItem(item, "activity")),
      ...adsLogs.map((item) => normalizeActivityItem(item, "ads")),
      ...payments.map((item) => normalizeActivityItem(item, "payment")),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 40);

    return NextResponse.json({
      ok: true,
      summary: {
        adAccountCount: adAccounts.length,
        totalSpent,
        transactionCount: transactions.length,
        activityCount: activities.length,
      },
      adAccounts,
      transactions,
      activities,
    });
  } catch (err) {
    console.error("Admin user insights error:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
