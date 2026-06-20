import { ObjectId } from "mongodb";
import { expandAdAccountRequests, normalizeAssignedAccounts } from "@/lib/adAccountRequests";
import { DEFAULT_USD_TO_BDT_RATE, resolveUsdToBdtRate } from "@/lib/currency";
import { serializeMongoId } from "@/lib/serializeMongoId";

const GLOBAL_ID = "global";

export function applyRateOperation(currentRate, operation, value) {
  const current = resolveUsdToBdtRate(currentRate, DEFAULT_USD_TO_BDT_RATE);
  const amount = Number(value);
  if (!Number.isFinite(amount)) return current;

  let next = current;
  switch (operation) {
    case "set":
      next = amount;
      break;
    case "increase":
      next = current + amount;
      break;
    case "decrease":
      next = current - amount;
      break;
    case "increase_percent":
      next = current * (1 + amount / 100);
      break;
    case "decrease_percent":
      next = current * (1 - amount / 100);
      break;
    default:
      next = current;
  }

  return Math.max(1, Math.round(next * 100) / 100);
}

function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function rowMatchesSearch(row, query) {
  if (!query) return true;
  const haystack = [
    row.type,
    row.label,
    row.userName,
    row.userEmail,
    row.userUid,
    row.accountName,
    row.bmId,
    row.metaAccountId,
    row.status,
    String(row.rate),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export async function getGlobalUsdRate(db) {
  const setting = await db.collection("settings").findOne({ key: "USD_TO_BDT_RATE" });
  return resolveUsdToBdtRate(setting?.value, DEFAULT_USD_TO_BDT_RATE);
}

export async function resolveUserEffectiveUsdRate(db, userUid, explicitRate = null) {
  const parsed = Number(explicitRate);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  const globalRate = await getGlobalUsdRate(db);
  if (!userUid) return globalRate;

  const user = await db.collection("users").findOne(
    { userId: userUid },
    { projection: { metaAdsConfig: 1 } }
  );
  return resolveUsdToBdtRate(user?.metaAdsConfig?.usdRate, globalRate);
}

export async function buildDollarRateRows(db) {
  const [globalRate, users, rawRequests] = await Promise.all([
    getGlobalUsdRate(db),
    db
      .collection("users")
      .find(
        {},
        {
          projection: {
            userId: 1,
            name: 1,
            email: 1,
            role: 1,
            status: 1,
            metaAdsConfig: 1,
            updatedAt: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray(),
    db.collection("adAccountRequests").find({}).sort({ createdAt: -1 }).toArray(),
  ]);

  const rows = [
    {
      id: GLOBAL_ID,
      type: "global",
      label: "Site default rate",
      userName: "",
      userEmail: "",
      userUid: "",
      accountName: "",
      bmId: "",
      metaAccountId: "",
      status: "active",
      rate: globalRate,
      source: "settings.USD_TO_BDT_RATE",
      updatedAt: null,
    },
  ];

  for (const user of users) {
    const rate = resolveUsdToBdtRate(user?.metaAdsConfig?.usdRate, globalRate);
    rows.push({
      id: user.userId,
      type: "user",
      label: user.name || user.email || user.userId,
      userName: user.name || "",
      userEmail: user.email || "",
      userUid: user.userId || "",
      accountName: "",
      bmId: "",
      metaAccountId: "",
      status: user.status || "active",
      rate,
      source: "users.metaAdsConfig.usdRate",
      updatedAt: user.updatedAt || null,
    });
  }

  const expanded = expandAdAccountRequests(rawRequests);
  const seenParents = new Set();

  for (const account of expanded) {
    const parentId = serializeMongoId(account.parentRequestId || account._id);
    if (!parentId || seenParents.has(`${parentId}-${account.MetaAccountID}-${account.accountName}`)) continue;
    seenParents.add(`${parentId}-${account.MetaAccountID}-${account.accountName}`);

    const user = users.find((u) => u.userId === account.userUid);
    const fallbackRate = resolveUsdToBdtRate(user?.metaAdsConfig?.usdRate, globalRate);

    rows.push({
      id: parentId,
      type: "account",
      label: account.accountName || "Ad Account",
      userName: user?.name || "",
      userEmail: account.userEmail || user?.email || "",
      userUid: account.userUid || "",
      accountName: account.accountName || "",
      bmId: account.bmId || "",
      metaAccountId: account.MetaAccountID || "",
      status: account.status || account.parentStatus || "pending",
      rate: resolveUsdToBdtRate(account.usdToBdtRate, fallbackRate),
      source: "adAccountRequests.usdToBdtRate",
      updatedAt: account.updatedAt || account.createdAt || null,
      requestIndex: account.requestIndex ?? 0,
    });
  }

  return { globalRate, rows };
}

export function filterDollarRateRows(rows, { search = "", scope = "all" } = {}) {
  const q = normalizeSearch(search);
  return rows.filter((row) => {
    if (scope !== "all" && row.type !== scope) return false;
    return rowMatchesSearch(row, q);
  });
}

export async function setGlobalUsdRate(db, rate) {
  const normalized = resolveUsdToBdtRate(rate, DEFAULT_USD_TO_BDT_RATE);
  if (normalized <= 0) throw new Error("Rate must be greater than 0");

  await db.collection("settings").updateOne(
    { key: "USD_TO_BDT_RATE" },
    { $set: { value: normalized, updatedAt: new Date() } },
    { upsert: true }
  );
  return normalized;
}

export async function setUserUsdRate(db, userId, rate) {
  const normalized = resolveUsdToBdtRate(rate, DEFAULT_USD_TO_BDT_RATE);
  const result = await db.collection("users").updateOne(
    { userId },
    {
      $set: {
        "metaAdsConfig.usdRate": normalized,
        updatedAt: new Date(),
      },
    }
  );
  if (result.matchedCount === 0) throw new Error("User not found");
  return normalized;
}

export async function setAccountUsdRate(db, requestId, rate) {
  if (!ObjectId.isValid(requestId)) throw new Error("Invalid account ID");
  const normalized = resolveUsdToBdtRate(rate, DEFAULT_USD_TO_BDT_RATE);

  const existing = await db.collection("adAccountRequests").findOne({ _id: new ObjectId(requestId) });
  if (!existing) throw new Error("Ad account not found");

  const assignedAccounts = normalizeAssignedAccounts(existing.assignedAccounts, {
    ...existing,
    usdToBdtRate: normalized,
  });

  await db.collection("adAccountRequests").updateOne(
    { _id: existing._id },
    {
      $set: {
        usdToBdtRate: normalized,
        assignedAccounts,
        updatedAt: new Date(),
      },
    }
  );
  return normalized;
}

export async function applyBulkDollarRateUpdate(db, options) {
  const {
    operation = "set",
    value = 0,
    scope = "filtered",
    search = "",
    selected = [],
  } = options;

  const { rows: allRows } = await buildDollarRateRows(db);
  let targets = [];

  if (scope === "selected" && Array.isArray(selected) && selected.length > 0) {
    const selectedKeys = new Set(selected.map((item) => `${item.type}:${item.id}`));
    targets = allRows.filter((row) => selectedKeys.has(`${row.type}:${row.id}`));
  } else if (scope === "global") {
    targets = allRows.filter((row) => row.type === "global");
  } else if (scope === "users") {
    targets = filterDollarRateRows(allRows, { search, scope: "user" });
  } else if (scope === "accounts") {
    targets = filterDollarRateRows(allRows, { search, scope: "account" });
  } else {
    targets = filterDollarRateRows(allRows, { search, scope: "all" });
  }

  const unique = new Map();
  for (const row of targets) {
    unique.set(`${row.type}:${row.id}`, row);
  }
  targets = [...unique.values()];

  const summary = { updated: 0, global: 0, users: 0, accounts: 0, errors: [] };

  for (const row of targets) {
    try {
      const nextRate = applyRateOperation(row.rate, operation, value);
      if (row.type === "global") {
        await setGlobalUsdRate(db, nextRate);
        summary.global += 1;
      } else if (row.type === "user") {
        await setUserUsdRate(db, row.id, nextRate);
        summary.users += 1;
      } else if (row.type === "account") {
        await setAccountUsdRate(db, row.id, nextRate);
        summary.accounts += 1;
      }
      summary.updated += 1;
    } catch (err) {
      summary.errors.push({ id: row.id, type: row.type, error: err.message || "Update failed" });
    }
  }

  return summary;
}
