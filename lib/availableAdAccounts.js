import { expandAdAccountRequests } from "@/lib/adAccountRequests";
import { normalizeAdAccountId } from "@/lib/metaAdsAccess";
import { serializeMongoId } from "@/lib/serializeMongoId";

const FB_ACCOUNT_STATUS_LABELS = {
  1: "Active",
  2: "Disabled",
  3: "Unsettled",
  7: "Pending review",
  8: "Pending settlement",
  9: "In grace period",
  100: "Pending closure",
  101: "Closed",
};

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function normalizeBmId(value) {
  return String(value || "").trim();
}

function matchesBm(requestBmId, businessId, bmName) {
  const normalized = normalizeBmId(requestBmId);
  if (!normalized) return false;
  return normalized === normalizeBmId(businessId) || normalized === normalizeBmId(bmName);
}

function fbStatusLabel(code) {
  const numeric = Number(code);
  if (Number.isFinite(numeric) && FB_ACCOUNT_STATUS_LABELS[numeric]) {
    return FB_ACCOUNT_STATUS_LABELS[numeric];
  }
  return code == null || code === "" ? "Unknown" : String(code);
}

function parseFbMoneyFields(acc) {
  const spendCap = Number(acc?.spend_cap ?? acc?.spendCap ?? 0) / 100;
  const amountSpent = Number(acc?.amount_spent ?? acc?.amountSpent ?? 0) / 100;
  if (!Number.isFinite(spendCap) || !Number.isFinite(amountSpent)) {
    return { spendCap: 0, amountSpent: 0, remaining: 0 };
  }
  return {
    spendCap: roundMoney(spendCap),
    amountSpent: roundMoney(amountSpent),
    remaining: roundMoney(Math.max(0, spendCap - amountSpent)),
  };
}

function buildUserSnapshot(userMap, userUid, userEmail) {
  const user = userMap.get(userUid);
  if (!user && !userEmail) return null;
  return {
    userId: userUid || "",
    name: user?.name || userEmail || "Unknown user",
    email: user?.email || userEmail || "",
    href: userUid ? `/admin-dashboard/users/${encodeURIComponent(userUid)}` : null,
  };
}

function buildAssignmentIndex(requests, userMap) {
  const expanded = expandAdAccountRequests(requests);
  const byMetaId = new Map();
  const pendingByBm = new Map();

  for (const account of expanded) {
    const status = String(account.status || account.parentStatus || "pending").toLowerCase();
    if (["cancelled", "canceled", "rejected"].includes(status)) continue;

    const requestId = serializeMongoId(account.parentRequestId || account._id);
    const metaId = normalizeAdAccountId(account.MetaAccountID);
    const bmId = normalizeBmId(account.bmId);
    const assignedUser = buildUserSnapshot(userMap, account.userUid, account.userEmail);

    const entry = {
      metaId,
      accountName: account.accountName || "",
      appStatus: status,
      monthlyBudget: Number(account.monthlyBudget || 0),
      assignedUser,
      requestId,
      bmId,
      hrefRequest: requestId ? `/admin-dashboard/meta-ads/${encodeURIComponent(requestId)}` : null,
    };

    if (metaId) {
      byMetaId.set(metaId, entry);
      continue;
    }

    if (!bmId) continue;
    if (!pendingByBm.has(bmId)) pendingByBm.set(bmId, []);
    pendingByBm.get(bmId).push(entry);
  }

  return { byMetaId, pendingByBm };
}

function buildAccountRow({
  metaId,
  accountName,
  fbAccountStatus,
  currency,
  spendCap,
  amountSpent,
  remaining,
  assignment,
  source,
  bmId = "",
  bmName = "",
}) {
  const assignedUser = assignment?.assignedUser || null;
  const appStatus = assignment?.appStatus || (metaId ? "unassigned" : "pending");
  const requestId = assignment?.requestId || null;

  return {
    metaId: metaId || "",
    accountName:
      accountName ||
      assignment?.accountName ||
      (metaId ? `Ad Account ${String(metaId).slice(-4)}` : "Pending account"),
    fbAccountStatus: fbAccountStatus ?? null,
    fbAccountStatusLabel: fbStatusLabel(fbAccountStatus),
    appStatus,
    spendCap: roundMoney(spendCap || 0),
    amountSpent: roundMoney(amountSpent || 0),
    remaining: roundMoney(remaining || 0),
    currency: currency || "USD",
    monthlyBudget: Number(assignment?.monthlyBudget || 0),
    assignedUser,
    requestId,
    hrefRequest: assignment?.hrefRequest || (requestId ? `/admin-dashboard/meta-ads/${encodeURIComponent(requestId)}` : null),
    hrefUser: assignedUser?.href || null,
    bmId: bmId || assignment?.bmId || "",
    bmName,
    source,
    isAssigned: Boolean(assignedUser?.userId || assignedUser?.email),
  };
}

async function fetchBmAdAccounts(bm) {
  const businessId = normalizeBmId(bm?.businessId);
  const token = String(bm?.token || "").trim();

  if (!businessId) {
    return { connectionStatus: "missing_id", connectionMessage: "Business ID not configured", accounts: [] };
  }
  if (!token) {
    return { connectionStatus: "missing_token", connectionMessage: "Access token not configured", accounts: [] };
  }

  try {
    const graphParams = new URLSearchParams({
      access_token: token,
      fields: "account_id,id,name,spend_cap,amount_spent,account_status,currency",
      limit: "200",
    });

    const fbRes = await fetch(
      `https://graph.facebook.com/v21.0/${businessId}/adaccounts?${graphParams.toString()}`,
      { cache: "no-store" }
    );
    const data = await fbRes.json();

    if (data?.error) {
      return {
        connectionStatus: "error",
        connectionMessage: data.error.message || "Facebook API error",
        accounts: [],
      };
    }

    const accounts = Array.isArray(data?.data) ? data.data : [];
    return {
      connectionStatus: "connected",
      connectionMessage: `${accounts.length} account${accounts.length === 1 ? "" : "s"} synced from Meta`,
      accounts,
    };
  } catch (error) {
    return {
      connectionStatus: "error",
      connectionMessage: error?.message || "Could not reach Meta API",
      accounts: [],
    };
  }
}

function connectionMeta(status) {
  switch (status) {
    case "connected":
      return { label: "Connected", tone: "success" };
    case "missing_token":
      return { label: "No token", tone: "warning" };
    case "missing_id":
      return { label: "No BM ID", tone: "warning" };
    case "error":
      return { label: "Connection error", tone: "danger" };
    default:
      return { label: "Not configured", tone: "muted" };
  }
}

async function buildBmGroup(bm, bmIndex, assignmentIndex) {
  const businessId = normalizeBmId(bm?.businessId);
  const bmName = bm?.bmName?.trim() || `BM ${bmIndex + 1}`;
  const { byMetaId, pendingByBm } = assignmentIndex;

  const fetchResult = await fetchBmAdAccounts(bm);
  const rows = new Map();
  const seenMeta = new Set();

  for (const acc of fetchResult.accounts) {
    const metaId = normalizeAdAccountId(acc.account_id || acc.id);
    if (!metaId) continue;
    seenMeta.add(metaId);

    const money = parseFbMoneyFields(acc);
    const assignment = byMetaId.get(metaId);

    rows.set(metaId, buildAccountRow({
      metaId,
      accountName: acc.name || assignment?.accountName,
      fbAccountStatus: acc.account_status,
      currency: acc.currency,
      ...money,
      assignment,
      source: "bm_api",
      bmId: businessId,
      bmName,
    }));
  }

  for (const slot of bm?.slots || []) {
    const metaId = normalizeAdAccountId(slot?.metaId);
    if (!metaId || seenMeta.has(metaId)) continue;
    seenMeta.add(metaId);

    const assignment = byMetaId.get(metaId);
    rows.set(
      metaId,
      buildAccountRow({
        metaId,
        accountName: assignment?.accountName,
        fbAccountStatus: null,
        currency: "USD",
        spendCap: 0,
        amountSpent: 0,
        remaining: 0,
        assignment,
        source: "slot",
        bmId: businessId,
        bmName,
      })
    );
  }

  const pendingKeys = [businessId, bmName].filter(Boolean);
  for (const [bmKey, pendingRows] of pendingByBm.entries()) {
    if (!pendingKeys.some((key) => matchesBm(bmKey, key, bmName))) continue;

    for (const pending of pendingRows) {
      const key = pending.requestId || `pending-${pending.accountName}`;
      if (rows.has(key)) continue;
      rows.set(
        key,
        buildAccountRow({
          metaId: "",
          accountName: pending.accountName,
          fbAccountStatus: null,
          currency: "USD",
          spendCap: 0,
          amountSpent: 0,
          remaining: 0,
          assignment: pending,
          source: "request",
          bmId: businessId,
          bmName,
        })
      );
    }
  }

  for (const [metaId, assignment] of byMetaId.entries()) {
    if (seenMeta.has(metaId)) continue;
    if (!matchesBm(assignment.bmId, businessId, bmName)) continue;

    rows.set(
      metaId,
      buildAccountRow({
        metaId,
        accountName: assignment.accountName,
        fbAccountStatus: null,
        currency: "USD",
        spendCap: 0,
        amountSpent: 0,
        remaining: 0,
        assignment,
        source: "mapped",
        bmId: businessId,
        bmName,
      })
    );
  }

  const accounts = [...rows.values()].sort((a, b) => {
    if (a.isAssigned !== b.isAssigned) return a.isAssigned ? -1 : 1;
    return (a.accountName || a.metaId).localeCompare(b.accountName || b.metaId);
  });

  const assignedCount = accounts.filter((item) => item.isAssigned).length;
  const meta = connectionMeta(fetchResult.connectionStatus);

  return {
    bmIndex,
    businessId,
    bmName,
    connectionStatus: fetchResult.connectionStatus,
    connectionLabel: meta.label,
    connectionTone: meta.tone,
    connectionMessage: fetchResult.connectionMessage,
    accountCount: accounts.length,
    assignedCount,
    unassignedCount: Math.max(0, accounts.length - assignedCount),
    accounts,
    hrefSettings: "/admin-dashboard/settings",
  };
}

export async function buildAvailableAdAccountsOverview(db) {
  const bmSetting = await db.collection("settings").findOne({ key: "FB_BM_CONFIGS" });
  const bmConfigs = Array.isArray(bmSetting?.value) ? bmSetting.value.filter(Boolean) : [];

  const [requests, users] = await Promise.all([
    db.collection("adAccountRequests").find({}).toArray(),
    db
      .collection("users")
      .find({}, { projection: { userId: 1, name: 1, email: 1 } })
      .toArray(),
  ]);

  const userMap = new Map(users.map((user) => [user.userId, user]));
  const assignmentIndex = buildAssignmentIndex(requests, userMap);

  const businessManagers = await Promise.all(
    bmConfigs.map((bm, bmIndex) => buildBmGroup(bm, bmIndex, assignmentIndex))
  );

  const totalAccounts = businessManagers.reduce((sum, bm) => sum + bm.accountCount, 0);
  const assignedAccounts = businessManagers.reduce((sum, bm) => sum + bm.assignedCount, 0);
  const connectedBMs = businessManagers.filter((bm) => bm.connectionStatus === "connected").length;

  return {
    summary: {
      totalBMs: businessManagers.length,
      connectedBMs,
      totalAccounts,
      assignedAccounts,
      unassignedAccounts: Math.max(0, totalAccounts - assignedAccounts),
    },
    businessManagers,
    generatedAt: new Date().toISOString(),
  };
}
