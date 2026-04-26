"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Search,
  RefreshCw,
  Loader2,
  Plus as PlusIcon,
  Wallet,
  ChevronDown,
  Building2,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import useAppAuth from "@/hooks/useAppAuth";
import IncreaseBudgetModal from "./IncreaseBudgetModal";
import TopupModal from "./TopupModal";
import CurrencyAmount from "./CurrencyAmount";
import MetaSpendingOverview from "./MetaSpendingOverview";
import { formatUsd, resolveUsdToBdtRate, toSafeNumber } from "@/lib/currency";
import { expandAdAccountRequests } from "@/lib/adAccountRequests";

const FILTERS = ["All Accounts", "Ready Accounts", "Pending Setup", "Needs Attention"];
const statCardBaseClass = "dashboard-subpanel overflow-hidden rounded-[28px] border p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]";
const adAccountPageCache = new Map();
const AD_ACCOUNTS_CACHE_TTL_MS = 5 * 60 * 1000;

const getStorageCacheKey = (cacheKey) => `ad-account-ui-cache:${cacheKey}`;

const getCardTone = (stateMeta, hasError, canFetchBalance) => {
  if (hasError) {
    return {
      accent: "from-amber-400/55 via-orange-300/32 to-transparent",
      icon: "border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,238,190,0.96))] text-amber-800",
      stat: "border-amber-200/75 bg-[rgba(255,243,210,0.96)]",
    };
  }

  if (!canFetchBalance || stateMeta.label === "Pending Setup" || stateMeta.label === "Syncing") {
    return {
      accent: "from-slate-300/60 via-cyan-200/34 to-transparent",
      icon: "border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(226,246,255,0.96))] text-slate-700",
      stat: "border-slate-200/80 bg-[rgba(235,248,255,0.96)]",
    };
  }

  return {
    accent: "from-emerald-400/55 via-sky-300/32 to-transparent",
    icon: "border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(218,250,235,0.96))] text-emerald-800",
    stat: "border-emerald-100/80 bg-[rgba(230,252,241,0.96)]",
  };
};

const activeAdMeta = {
  label: "Active",
  className: "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-accent)] ring-1 ring-[var(--dashboard-frame-border)]",
};

const disabledAdMeta = {
  label: "Disabled",
  className: "bg-[var(--dashboard-danger-soft)] text-[#ff8b8b] ring-1 ring-[var(--dashboard-frame-border)]",
};

const mutedAdMeta = (label) => ({
  label,
  className: "bg-[var(--dashboard-panel-soft)] dashboard-text-muted ring-1 ring-[var(--dashboard-frame-border)]",
});

/** Meta Ad Account `account_status` (numeric or string); Graph sometimes returns strings. */
const getAdStatusMeta = (status) => {
  if (status === null || status === undefined || status === "") {
    return activeAdMeta;
  }

  const n = Number(typeof status === "string" ? String(status).trim() : status);
  if (Number.isFinite(n)) {
    switch (n) {
      case 1:
        return activeAdMeta;
      case 2:
        return disabledAdMeta;
      case 3:
        // Meta "UNSETTLED" often appears while billing syncs; balance still loads — avoid confusing second badge.
        return activeAdMeta;
      case 7:
        return mutedAdMeta("Risk review");
      case 8:
        return mutedAdMeta("Pending settlement");
      case 9:
        return mutedAdMeta("Grace period");
      case 100:
        return mutedAdMeta("Pending closure");
      case 101:
        return mutedAdMeta("Closed");
      default:
        return activeAdMeta;
    }
  }

  const s = String(status).trim().toUpperCase();
  if (s === "ACTIVE" || s === "1") return activeAdMeta;
  if (s === "DISABLED" || s === "2") return disabledAdMeta;

  return activeAdMeta;
};

const normalizeAdAccountId = (value) => String(value || "").replace(/^act_/, "").trim();

const isFetchableMetaAccount = (account) => {
  const status = String(account?.status || "").toLowerCase();
  const cleanId = normalizeAdAccountId(account?.MetaAccountID);
  return status === "active" && /^\d{8,}$/.test(cleanId);
};

const getReadableMetaError = (message, code, subcode) => {
  const text = String(message || "").toLowerCase();

  if (code === 190 || text.includes("invalid oauth") || text.includes("access token")) {
    return "Meta token is invalid or expired. Please contact support.";
  }

  if (
    code === 10 ||
    code === 200 ||
    text.includes("permissions error") ||
    text.includes("does not have the capability") ||
    text.includes("permission")
  ) {
    return "Meta permission missing for this account. Please contact support.";
  }

  if (
    code === 100 ||
    text.includes("unsupported get request") ||
    text.includes("does not exist") ||
    text.includes("cannot be loaded due to missing permissions")
  ) {
    return "This ad account is not accessible with the current Meta setup.";
  }

  if (subcode === 33 || text.includes("object with id")) {
    return "Meta could not find this ad account under the current business access.";
  }

  return message || "Live Meta balance unavailable right now.";
};

const getAccountState = (account, balance) => {
  if (!isFetchableMetaAccount(account)) {
    return {
      label: "Pending Setup",
      tone: "dashboard-text-muted bg-[var(--dashboard-panel-soft)] ring-[var(--dashboard-frame-border)]",
      helper: "Waiting for a valid active Meta account ID.",
    };
  }

  if (balance?.error) {
    return {
      label: "Needs Attention",
      tone: "text-[#efb45d] bg-[var(--dashboard-warn-soft)] ring-[var(--dashboard-frame-border)]",
      helper: balance.readableError || balance.error,
    };
  }

  if (!balance || balance.loading) {
    return {
      label: "Syncing",
      tone: "dashboard-text-muted bg-[var(--dashboard-panel-soft)] ring-[var(--dashboard-frame-border)]",
      helper: "Refreshing live account balance.",
    };
  }

  const statusMeta = getAdStatusMeta(balance.status);
  return {
    label: statusMeta.label,
    tone: statusMeta.className.replace("ring-1 ", ""),
    helper: "Live Meta balance data available.",
  };
};

function AdAccountTableMetricCell({ label, value, valueTone, balance, canFetchBalance, hasError, usdRate }) {
  const showUnavailable = hasError || !canFetchBalance;
  const showLoading = canFetchBalance && balance?.loading;

  return (
    <td className="align-top border-b border-white/5 px-3 py-3 sm:px-4">
      <p className="dashboard-text-faint mb-1 text-[9px] font-bold uppercase tracking-[0.14em]">{label}</p>
      {showLoading ? (
        <div className="space-y-2 pt-0.5">
          <div className="h-4 w-20 animate-pulse rounded bg-[var(--dashboard-frame-border)]" />
          <div className="h-3 w-16 animate-pulse rounded bg-[var(--dashboard-panel-soft)]" />
        </div>
      ) : showUnavailable ? (
        <div>
          <p className="dashboard-text-strong text-sm font-black">Unavailable</p>
          <p className="dashboard-text-muted mt-0.5 max-w-[10rem] text-[10px] leading-snug">
            {!canFetchBalance
              ? "Awaiting valid Meta setup"
              : balance?.readableError || balance?.error || "Live Meta balance unavailable"}
          </p>
        </div>
      ) : (
        <div>
          <p
            className={`text-sm font-black leading-tight sm:text-base ${
              valueTone === "rose" ? "text-rose-400" : valueTone === "emerald" ? "text-emerald-400" : "dashboard-text-strong"
            }`}
          >
            {formatUsd(value)}
          </p>
          <CurrencyAmount
            value={value}
            usdToBdtRate={usdRate}
            primaryClassName="hidden"
            secondaryClassName="dashboard-text-muted mt-0.5 text-[10px] font-semibold sm:text-[11px]"
            secondaryPrefix=""
          />
        </div>
      )}
    </td>
  );
}

export default function AdAccountUi({ onRequestNewAccount }) {
  const { token, userData, user } = useAppAuth();
  const metaAdsConfig = userData?.metaAdsConfig || {};
  const usdRate = resolveUsdToBdtRate(userData?.currencyConfig?.usdToBdtRate ?? metaAdsConfig.usdRate);
  const cacheKey = user?.uid || "anonymous";
  const allowBudgetIncrease = metaAdsConfig.allowBudgetIncrease !== false;
  const allowTopupAction = metaAdsConfig.allowTopupAction !== false;
  const remainingOverride =
    metaAdsConfig.remainingBudgetOverride === null ||
    metaAdsConfig.remainingBudgetOverride === undefined
      ? null
      : toSafeNumber(metaAdsConfig.remainingBudgetOverride);

  const [adAccounts, setAdAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const balancesRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState("");
  const [filter, setFilter] = useState("All Accounts");
  const [searchTerm, setSearchTerm] = useState("");
  const didRestoreCacheRef = useRef(false);

  const [increaseModal, setIncreaseModal] = useState({
    open: false,
    adAccountId: null,
    oldLimit: null,
  });
  const [topupModal, setTopupModal] = useState(false);

  const assignedUsdToBdtRate = useMemo(() => {
    for (const acc of adAccounts) {
      if (!isFetchableMetaAccount(acc)) continue;
      const n = Number(acc?.usdToBdtRate);
      if (Number.isFinite(n) && n > 0) return n;
    }
    for (const acc of adAccounts) {
      const n = Number(acc?.usdToBdtRate);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
  }, [adAccounts]);

  const displayBdtConversionRate = assignedUsdToBdtRate > 0 ? assignedUsdToBdtRate : usdRate;

  const handleRequestNewAccount = useCallback(() => {
    if (typeof onRequestNewAccount === "function") {
      onRequestNewAccount();
    }
  }, [onRequestNewAccount]);

  useEffect(() => {
    balancesRef.current = balances;
  }, [balances]);

  useEffect(() => {
    if (didRestoreCacheRef.current) return;

    const cachedState = adAccountPageCache.get(cacheKey);
    if (cachedState) {
      setAdAccounts(expandAdAccountRequests(Array.isArray(cachedState.adAccounts) ? cachedState.adAccounts : []));
      setBalances(cachedState.balances && typeof cachedState.balances === "object" ? cachedState.balances : {});
      setFilter(cachedState.filter || "All Accounts");
      setSearchTerm(cachedState.searchTerm || "");
      setListError(cachedState.listError || "");
      setLoading(false);
      didRestoreCacheRef.current = true;
      return;
    }

    if (typeof window !== "undefined") {
      try {
        const raw = window.sessionStorage.getItem(getStorageCacheKey(cacheKey));
        if (raw) {
          const parsed = JSON.parse(raw);
          const isFresh =
            parsed &&
            typeof parsed === "object" &&
            Number.isFinite(parsed.savedAt) &&
            Date.now() - parsed.savedAt < AD_ACCOUNTS_CACHE_TTL_MS;

          if (isFresh) {
            const restored = {
              hydrated: true,
              adAccounts: Array.isArray(parsed.adAccounts) ? parsed.adAccounts : [],
              balances: parsed.balances && typeof parsed.balances === "object" ? parsed.balances : {},
              filter: parsed.filter || "All Accounts",
              searchTerm: parsed.searchTerm || "",
              listError: parsed.listError || "",
            };
            adAccountPageCache.set(cacheKey, restored);
            setAdAccounts(expandAdAccountRequests(restored.adAccounts));
            setBalances(restored.balances);
            setFilter(restored.filter);
            setSearchTerm(restored.searchTerm);
            setListError(restored.listError);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to restore ad account cache:", error);
      }
    }

    didRestoreCacheRef.current = true;
  }, [cacheKey]);

  useEffect(() => {
    if (!didRestoreCacheRef.current || loading) return;

    const nextCache = {
      hydrated: true,
      adAccounts,
      balances,
      filter,
      searchTerm,
      listError,
      savedAt: Date.now(),
    };
    adAccountPageCache.set(cacheKey, nextCache);

    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(
          getStorageCacheKey(cacheKey),
          JSON.stringify(nextCache)
        );
      } catch (error) {
        console.error("Failed to persist ad account cache:", error);
      }
    }
  }, [adAccounts, balances, cacheKey, filter, listError, loading, searchTerm]);

  const loadAccounts = useCallback(async () => {
    if (!token) return;

    try {
      setListError("");
      const res = await fetch("/api/ads-request/list", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || "Failed to load ad accounts");
      }
      setAdAccounts(expandAdAccountRequests(Array.isArray(json.data) ? json.data : []));
    } catch (err) {
      setListError(err.message || "Failed to load ad accounts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const cachedState = adAccountPageCache.get(cacheKey);
    if (cachedState?.hydrated) {
      setLoading(false);
      return;
    }

    loadAccounts();
  }, [cacheKey, loadAccounts]);

  const fetchBalance = useCallback(
    async (adAccountId, force = false) => {
      const cleanAdId = normalizeAdAccountId(adAccountId);
      if (!cleanAdId || !/^\d{8,}$/.test(cleanAdId)) return;

      const currentBalance = balancesRef.current[adAccountId];
      if (!force && currentBalance) return;

      setBalances((prev) => ({ ...prev, [adAccountId]: { loading: true } }));

      try {
        const res = await fetch(`/api/ads-request/balance?ad_account_id=${cleanAdId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        setBalances((prev) => ({
          ...prev,
          [adAccountId]: res.ok
            ? {
                spendCap: toSafeNumber(json.spendCap),
                amountSpent: toSafeNumber(json.amountSpent),
                remaining: toSafeNumber(json.remaining),
                status: json.status,
              }
            : {
                error: json.error || "Failed to fetch balance",
                readableError: getReadableMetaError(
                  json.error || "Failed to fetch balance",
                  json.meta_code,
                  json.meta_subcode
                ),
                metaCode: json.meta_code || null,
                metaSubcode: json.meta_subcode || null,
              },
        }));
      } catch (err) {
        setBalances((prev) => ({
          ...prev,
          [adAccountId]: {
            error: err.message || "Request failed",
            readableError: "Network issue while loading live Meta balance.",
          },
        }));
      }
    },
    [token]
  );

  useEffect(() => {
    adAccounts.forEach((acc) => {
      if (isFetchableMetaAccount(acc)) fetchBalance(acc.MetaAccountID);
    });
  }, [adAccounts, fetchBalance]);

  const refreshBalances = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/ads-request/list", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || "Failed to load ad accounts");
      }

      const freshAccounts = Array.isArray(json.data) ? json.data : [];
      setListError("");
      setAdAccounts(expandAdAccountRequests(freshAccounts));
      setBalances({});
      balancesRef.current = {};
      adAccountPageCache.delete(cacheKey);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(getStorageCacheKey(cacheKey));
      }

      await Promise.all(
        freshAccounts
          .filter(isFetchableMetaAccount)
          .map((acc) => fetchBalance(acc.MetaAccountID, true))
      );
    } catch (err) {
      setListError(err.message || "Failed to refresh ad accounts");
    } finally {
      setRefreshing(false);
    }
  };

  const accountStats = useMemo(() => {
    return adAccounts.reduce(
      (acc, item) => {
        const balance = balances[item.MetaAccountID];
        const fetchable = isFetchableMetaAccount(item);
        if (fetchable) acc.ready += 1;
        if (!fetchable) acc.pending += 1;
        if (balance?.error) acc.issue += 1;
        return acc;
      },
      { ready: 0, pending: 0, issue: 0 }
    );
  }, [adAccounts, balances]);

  const totalRemaining = useMemo(() => {
    return Object.values(balances).reduce((acc, curr) => {
      if (!curr || curr.error || curr.loading) return acc;
      return acc + toSafeNumber(curr.remaining);
    }, 0);
  }, [balances]);

  const remainingDisplay = remainingOverride !== null ? remainingOverride : totalRemaining;

  const filteredAccounts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return adAccounts.filter((acc) => {
      const balance = balances[acc.MetaAccountID];
      const fetchable = isFetchableMetaAccount(acc);
      const matchSearch =
        !q ||
        String(acc?.accountName || "").toLowerCase().includes(q) ||
        String(acc?.MetaAccountID || "").toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filter === "Ready Accounts") return fetchable && !balance?.error;
      if (filter === "Pending Setup") return !fetchable;
      if (filter === "Needs Attention") return Boolean(balance?.error);

      return true;
    });
  }, [adAccounts, balances, filter, searchTerm]);

  if (loading) {
                  return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-300" size={32} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <section className="dashboard-subpanel mt-2 overflow-hidden rounded-[26px] border border-white/10 px-4 py-3.5 sm:rounded-[30px] sm:px-5 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-text-strong text-[1.5rem] font-black tracking-tight sm:text-[1.7rem]">Ad Accounts</h1>
              <p className="dashboard-text-muted mt-1.5 text-sm leading-5">Manage account readiness, live balances, and account actions from one workspace.</p>
            </div>

            <button
              onClick={handleRequestNewAccount}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-900/30 transition-all hover:bg-blue-600 sm:w-auto"
            >
              <PlusIcon size={18} />
              Request New Account
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`${statCardBaseClass} !border-emerald-300/60 !bg-[linear-gradient(135deg,rgba(183,223,105,0.52),rgba(183,223,105,0.24)_48%,rgba(255,255,255,0.94))]`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold dashboard-text-muted">Ready Accounts</p>
                <p className="mt-2 text-[1.65rem] font-black leading-none dashboard-text-strong">{accountStats.ready}</p>
                <p className="mt-2 text-sm dashboard-text-muted">Live Meta balances available</p>
              </div>
              <div className="dashboard-accent-surface flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-white">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="dashboard-chip inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
              Ready for spend
            </div>
          </div>

          <div className={`${statCardBaseClass} !border-sky-300/60 !bg-[linear-gradient(135deg,rgba(115,200,255,0.44),rgba(115,200,255,0.2)_50%,rgba(255,255,255,0.94))]`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold dashboard-text-muted">Pending Setup</p>
                <p className="mt-2 text-[1.65rem] font-black leading-none dashboard-text-strong">{accountStats.pending}</p>
                <p className="mt-2 text-sm dashboard-text-muted">Need active account mapping</p>
              </div>
              <div className="dashboard-accent-surface flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-white">
                <AlertCircle size={18} />
              </div>
            </div>
            <div className="dashboard-chip inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
              Setup required
            </div>
          </div>

          <div className={`${statCardBaseClass} !border-amber-300/60 !bg-[linear-gradient(135deg,rgba(245,158,11,0.38),rgba(251,191,36,0.2)_50%,rgba(255,255,255,0.94))]`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold dashboard-text-muted">Needs Attention</p>
                <p className="mt-2 text-[1.65rem] font-black leading-none dashboard-text-strong">{accountStats.issue}</p>
                <p className="mt-2 text-sm dashboard-text-muted">Token or balance sync issue</p>
              </div>
              <div className="dashboard-accent-surface flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-white">
                <RefreshCw size={18} />
              </div>
            </div>
            <div className="dashboard-chip inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
              Review needed
            </div>
          </div>

          <div className={`${statCardBaseClass} !border-indigo-300/55 !bg-[linear-gradient(135deg,rgba(103,163,255,0.42),rgba(103,163,255,0.18)_52%,rgba(255,255,255,0.94))]`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold dashboard-text-muted">Total Remaining</p>
                <p className="mt-2 text-[1.65rem] font-black leading-none dashboard-text-strong">{formatUsd(remainingDisplay)}</p>
                <p className="mt-2 text-sm dashboard-text-muted">Across synced active accounts</p>
              </div>
              <div className="dashboard-accent-surface flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-white">
                <Wallet size={18} />
              </div>
            </div>
            <div className="dashboard-chip inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
              Available budget
            </div>
          </div>
        </div>
        {listError && (
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-danger-soft)] p-4 text-[#ff8b8b]">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Couldn&apos;t load ad account requests</p>
              <p className="mt-1 text-sm text-red-100/80">{listError}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <MetaSpendingOverview
            className="p-4 sm:p-6"
            assignedUsdToBdtRate={assignedUsdToBdtRate}
            profileUsdToBdtRate={userData?.currencyConfig?.usdToBdtRate ?? metaAdsConfig.usdRate}
          />

          <section className="rounded-[2rem]">
            <div className="px-1 py-1">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="dashboard-text-strong text-xl font-black">Ad Accounts</h3>
                  <p className="dashboard-text-muted text-sm">
                    Review account readiness, balance sync, and available actions from one workspace.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:items-center">
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      placeholder="Search account..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-2xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] py-2.5 pl-10 pr-4 text-sm dashboard-text-strong placeholder:dashboard-text-faint focus:outline-none focus:ring-2 focus:ring-blue-400/20 lg:w-60"
                    />
                  </div>

                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-2xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] py-2.5 pl-4 pr-10 text-xs font-bold dashboard-text-strong focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      {FILTERS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>

                  <button
                    onClick={refreshBalances}
                    disabled={refreshing}
                    className="dashboard-muted-button inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-black transition-all hover:bg-[var(--dashboard-panel-soft)] disabled:opacity-60 sm:w-auto"
                  >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              {filteredAccounts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-14 text-center">
                  <span className="dashboard-accent-surface mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl">
                    <Building2 size={28} className="text-[var(--dashboard-accent-text)]" />
                  </span>
                  <p className="mt-4 text-lg font-black text-white">No account found</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Try a different search or filter, or request a new account from the top of this page.
                  </p>
                </div>
              ) : (
                <div className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(232,250,218,0.08)_40%,rgba(226,245,255,0.08))] shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
                  <p className="dashboard-text-muted border-b border-white/10 px-3 py-2 text-[11px] sm:hidden">
                    Swipe horizontally to see all columns.
                  </p>
                  <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                    <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-[rgba(255,255,255,0.07)]">
                          <th
                            scope="col"
                            className="sticky left-0 z-[1] whitespace-nowrap bg-[rgba(248,252,246,0.96)] px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] dashboard-text-faint backdrop-blur-sm sm:px-4 lg:static lg:z-auto lg:bg-transparent lg:backdrop-blur-none"
                          >
                            Account
                          </th>
                          <th scope="col" className="whitespace-nowrap px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] dashboard-text-faint sm:px-4">
                            Status
                          </th>
                          <th scope="col" className="whitespace-nowrap px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] dashboard-text-faint sm:px-4">
                            Spend cap
                          </th>
                          <th scope="col" className="whitespace-nowrap px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] dashboard-text-faint sm:px-4">
                            Spent
                          </th>
                          <th scope="col" className="whitespace-nowrap px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] dashboard-text-faint sm:px-4">
                            Remaining
                          </th>
                          <th scope="col" className="min-w-[8rem] px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] dashboard-text-faint sm:px-4">
                            Note
                          </th>
                          <th scope="col" className="whitespace-nowrap px-3 py-3 text-right text-[10px] font-black uppercase tracking-[0.14em] dashboard-text-faint sm:px-4">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAccounts.map((account, i) => {
                          const balance = balances[account.MetaAccountID];
                          const canFetchBalance = isFetchableMetaAccount(account);
                          const hasError = Boolean(balance?.error);
                          const stateMeta = getAccountState(account, balance);
                          const showIncrease = allowBudgetIncrease && (userData?.walletBalance || 0) > 0;
                          const showTopup = allowTopupAction && (userData?.walletBalance || 0) === 0;
                          const rowKey = `${account.MetaAccountID || account._id || i}-${i}`;

                          return (
                            <React.Fragment key={rowKey}>
                              <tr className="border-b border-white/5 transition-colors hover:bg-white/[0.04]">
                                <td className="sticky left-0 z-[1] border-b border-white/5 bg-[rgba(255,255,255,0.92)] px-3 py-3 align-top backdrop-blur-sm sm:px-4 lg:static lg:z-auto lg:bg-transparent lg:backdrop-blur-none">
                                  <div className="flex items-start gap-2.5">
                                    <div
                                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ${getCardTone(stateMeta, hasError, canFetchBalance).icon}`}
                                    >
                                      <Building2 size={16} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="dashboard-text-strong truncate text-sm font-black sm:text-base">
                                        {account.accountName || "Unnamed Ad Account"}
                                      </p>
                                      <p className="dashboard-text-muted truncate font-mono text-[11px]">
                                        {account.MetaAccountID || "Meta ID not assigned yet"}
                                      </p>
                                      {account.bundleLead && account.bundleSize > 1 ? (
                                        <p className="dashboard-text-faint mt-1 text-[9px] font-black uppercase tracking-[0.12em]">
                                          Bundle · {account.bundleSize} accounts
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                </td>
                                <td className="border-b border-white/5 px-3 py-3 align-top sm:px-4">
                                  <div className="flex flex-col gap-1.5">
                                    <span className="dashboard-chip inline-flex w-fit items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]">
                                      {account.status || "pending"}
                                    </span>
                                    {String(stateMeta.label || "").toLowerCase() !==
                                    String(account.status || "pending").toLowerCase() ? (
                                      <span
                                        className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ring-1 ${stateMeta.tone}`}
                                      >
                                        {stateMeta.label}
                                      </span>
                                    ) : null}
                                  </div>
                                </td>
                                <AdAccountTableMetricCell
                                  label="Spend cap"
                                  value={balance?.spendCap}
                                  valueTone="strong"
                                  balance={balance}
                                  canFetchBalance={canFetchBalance}
                                  hasError={hasError}
                                  usdRate={displayBdtConversionRate}
                                />
                                <AdAccountTableMetricCell
                                  label="Spent"
                                  value={balance?.amountSpent}
                                  valueTone="rose"
                                  balance={balance}
                                  canFetchBalance={canFetchBalance}
                                  hasError={hasError}
                                  usdRate={displayBdtConversionRate}
                                />
                                <AdAccountTableMetricCell
                                  label="Remaining"
                                  value={balance?.remaining}
                                  valueTone="emerald"
                                  balance={balance}
                                  canFetchBalance={canFetchBalance}
                                  hasError={hasError}
                                  usdRate={displayBdtConversionRate}
                                />
                                <td className="border-b border-white/5 px-3 py-3 align-top sm:px-4">
                                  <div className="flex items-start gap-1.5">
                                    <ArrowUpRight size={14} className="mt-0.5 shrink-0 dashboard-text-muted" />
                                    <p className="dashboard-text-muted max-w-[14rem] text-xs leading-snug">{stateMeta.helper}</p>
                                  </div>
                                </td>
                                <td className="border-b border-white/5 px-3 py-3 align-top text-right sm:px-4">
                                  <div className="flex flex-col items-stretch justify-end gap-2 sm:items-end">
                                    {showIncrease && canFetchBalance && !hasError ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setIncreaseModal({
                                            open: true,
                                            adAccountId: account?.MetaAccountID,
                                            oldLimit: balance?.spendCap,
                                          })
                                        }
                                        className="dashboard-accent-surface whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-black transition hover:brightness-105 sm:text-[11px]"
                                      >
                                        Increase Budget
                                      </button>
                                    ) : null}
                                    {showTopup && canFetchBalance && !hasError ? (
                                      <button
                                        type="button"
                                        onClick={() => setTopupModal(true)}
                                        className="dashboard-accent-surface whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-black transition hover:brightness-105 sm:text-[11px]"
                                      >
                                        Add Funds
                                      </button>
                                    ) : null}
                                    {!showIncrease && !showTopup ? (
                                      <span className="dashboard-text-faint text-[10px] font-semibold">—</span>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                              {account.bundleLead && account.bundleSize > 1 ? (
                                <tr className="border-b border-white/5 bg-white/[0.03]">
                                  <td colSpan={7} className="px-3 py-2 sm:px-4">
                                    <p className="dashboard-text-faint mb-2 text-[9px] font-black uppercase tracking-[0.14em]">
                                      Included accounts
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {account.assignedAccounts.map((child, childIndex) => (
                                        <div
                                          key={`${account.parentRequestId || account._id}-${child.MetaAccountID || childIndex}`}
                                          className="inline-flex max-w-full items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5"
                                        >
                                          <span className="dashboard-text-strong truncate text-xs font-bold">
                                            {child.accountName || `Account ${childIndex + 1}`}
                                          </span>
                                          <span className="dashboard-text-muted truncate font-mono text-[10px]">
                                            {child.MetaAccountID || "—"}
                                          </span>
                                          <span className="dashboard-chip shrink-0 px-1.5 py-0.5 text-[8px] font-black uppercase">
                                            {child.status || "pending"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              ) : null}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <IncreaseBudgetModal
        open={increaseModal.open}
        adAccountId={increaseModal.adAccountId}
        oldLimit={increaseModal.oldLimit}
        onClose={() => setIncreaseModal({ open: false, adAccountId: null, oldLimit: null })}
        onSuccess={() => {
          adAccountPageCache.delete(cacheKey);
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem(getStorageCacheKey(cacheKey));
          }
          setBalances({});
          balancesRef.current = {};
          refreshBalances();
        }}
      />
      <TopupModal open={topupModal} onClose={() => setTopupModal(false)} />
    </>
  );
}
