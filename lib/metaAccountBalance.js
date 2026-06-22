import { expandAdAccountRequests } from "@/lib/adAccountRequests";
import { normalizeAdAccountId, resolveMetaAccessTokens } from "@/lib/metaAdsAccess";

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function buildAccountRow({
  metaId,
  accountName,
  bmName,
  spendCap,
  amountSpent,
  remaining,
  currency,
  source,
}) {
  const cap = Number(spendCap) || 0;
  const spent = Number(amountSpent) || 0;
  const left = Number.isFinite(remaining) ? remaining : cap - spent;

  return {
    metaId,
    accountName: accountName?.trim() || `Ad Account ${String(metaId || "").slice(-4)}`,
    bmName: bmName?.trim() || "",
    spendCap: roundMoney(cap),
    amountSpent: roundMoney(spent),
    remaining: roundMoney(Math.max(0, left)),
    currency: currency || "USD",
    source,
  };
}

export async function fetchMetaSpend(db, adAccountId) {
  const cleanId = normalizeAdAccountId(adAccountId);
  if (!cleanId || !/^\d+$/.test(cleanId)) return null;

  try {
    const { tokens } = await resolveMetaAccessTokens(db, cleanId);
    if (!tokens.length) return null;

    for (const candidate of tokens) {
      const graphParams = new URLSearchParams({
        access_token: candidate.token,
        fields: "spend_cap,amount_spent,account_status,currency,name",
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
          accountName: fbData.name || "",
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

async function loadBmConfigs(db) {
  const bmSetting = await db.collection("settings").findOne({ key: "FB_BM_CONFIGS" });
  return Array.isArray(bmSetting?.value) ? bmSetting.value.filter(Boolean) : [];
}

async function buildAccountNameMap(db) {
  const requests = await db.collection("adAccountRequests").find({}).toArray();
  const expanded = expandAdAccountRequests(requests);
  const map = new Map();

  for (const account of expanded) {
    const id = normalizeAdAccountId(account.MetaAccountID);
    if (!id) continue;
    if (!map.has(id) && account.accountName) {
      map.set(id, account.accountName);
    }
  }

  return map;
}

function accountRemainingFromFbFields(acc) {
  const spendCap = Number(acc?.spend_cap ?? acc?.spendCap ?? 0) / 100;
  const amountSpent = Number(acc?.amount_spent ?? acc?.amountSpent ?? 0) / 100;
  if (!Number.isFinite(spendCap) || !Number.isFinite(amountSpent)) return null;
  return {
    spendCap,
    amountSpent,
    remaining: Math.max(0, spendCap - amountSpent),
    accountName: acc?.name || acc?.accountName || "",
    currency: acc?.currency || "USD",
  };
}

async function listAccountsFromBusinessManagers(db, bmConfigs, nameMap) {
  const accounts = [];
  const seen = new Set();

  for (const bm of bmConfigs) {
    const businessId = String(bm?.businessId || "").trim();
    const token = String(bm?.token || "").trim();
    if (!businessId || !token) continue;

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
      if (data?.error || !Array.isArray(data?.data)) continue;

      for (const acc of data.data) {
        const accountId = normalizeAdAccountId(acc.account_id || acc.id);
        if (!accountId || seen.has(accountId)) continue;
        seen.add(accountId);

        const parsed = accountRemainingFromFbFields(acc);
        if (!parsed) continue;

        accounts.push(
          buildAccountRow({
            metaId: accountId,
            accountName: acc.name || nameMap.get(accountId),
            bmName: bm.bmName || bm.businessId,
            spendCap: parsed.spendCap,
            amountSpent: parsed.amountSpent,
            remaining: parsed.remaining,
            currency: acc.currency || parsed.currency,
            source: "bm",
          })
        );
      }
    } catch {
      /* try next BM */
    }
  }

  return { accounts, seen };
}

async function collectMappedMetaIds(db) {
  const ids = new Set();

  const requests = await db.collection("adAccountRequests").find({}).toArray();
  const expanded = expandAdAccountRequests(requests);

  for (const account of expanded) {
    const status = String(account.status || account.parentStatus || "").toLowerCase();
    if (["cancelled", "canceled", "rejected"].includes(status)) continue;

    const id = normalizeAdAccountId(account.MetaAccountID);
    if (id && /^\d{8,}$/.test(id)) ids.add(id);
  }

  const bmConfigs = await loadBmConfigs(db);
  for (const bm of bmConfigs) {
    for (const slot of bm.slots || []) {
      const id = normalizeAdAccountId(slot?.metaId);
      if (id && /^\d{8,}$/.test(id)) ids.add(id);
    }
  }

  const syncedAccounts = await db
    .collection("ad_accounts")
    .find({}, { projection: { accountId: 1, account_id: 1 } })
    .toArray();

  for (const acc of syncedAccounts) {
    const id = normalizeAdAccountId(acc.accountId || acc.account_id);
    if (id && /^\d{8,}$/.test(id)) ids.add(id);
  }

  return [...ids];
}

async function listAccountsFromMapped(db, { excludeIds = new Set(), nameMap, limit = 80 }) {
  const metaIds = (await collectMappedMetaIds(db))
    .filter((id) => !excludeIds.has(id))
    .slice(0, limit);

  if (!metaIds.length) {
    return { accounts: [], mappedAccountCount: 0 };
  }

  const syncedAccounts = await db.collection("ad_accounts").find({}).toArray();
  const syncedById = new Map();
  for (const acc of syncedAccounts) {
    const id = normalizeAdAccountId(acc.accountId || acc.account_id);
    if (id) syncedById.set(id, acc);
  }

  const accounts = [];

  await Promise.all(
    metaIds.map(async (id) => {
      const live = await fetchMetaSpend(db, id);
      if (live && Number.isFinite(live.remaining)) {
        accounts.push(
          buildAccountRow({
            metaId: id,
            accountName: live.accountName || nameMap.get(id),
            bmName: "",
            spendCap: live.spendCap,
            amountSpent: live.amountSpent,
            remaining: live.remaining,
            currency: live.currency,
            source: "mapped",
          })
        );
        return;
      }

      const cached = syncedById.get(id);
      const parsed = cached ? accountRemainingFromFbFields(cached) : null;
      if (!parsed) return;

      accounts.push(
        buildAccountRow({
          metaId: id,
          accountName: parsed.accountName || nameMap.get(id) || cached?.accountName,
          bmName: cached?.bmName || "",
          spendCap: parsed.spendCap,
          amountSpent: parsed.amountSpent,
          remaining: parsed.remaining,
          currency: parsed.currency,
          source: "cache",
        })
      );
    })
  );

  return { accounts, mappedAccountCount: metaIds.length };
}

export async function listAdAccountAvailableBalances(db) {
  const bmConfigs = await loadBmConfigs(db);
  const nameMap = await buildAccountNameMap(db);

  const fromBms = await listAccountsFromBusinessManagers(db, bmConfigs, nameMap);
  const fromMapped = await listAccountsFromMapped(db, {
    excludeIds: fromBms.seen,
    nameMap,
  });

  const accounts = [...fromBms.accounts, ...fromMapped.accounts].sort(
    (a, b) => b.remaining - a.remaining
  );

  const totalAvailableBalance = roundMoney(
    accounts.reduce((sum, account) => sum + account.remaining, 0)
  );

  return {
    totalAvailableBalance,
    liveAccountCount: accounts.length,
    mappedAccountCount: fromBms.seen.size + fromMapped.mappedAccountCount,
    accounts,
  };
}

export async function computeTotalAdAccountAvailableBalance(db) {
  const result = await listAdAccountAvailableBalances(db);
  return {
    totalAvailableBalance: result.totalAvailableBalance,
    liveAccountCount: result.liveAccountCount,
    mappedAccountCount: result.mappedAccountCount,
  };
}
