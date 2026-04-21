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
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import IncreaseBudgetModal from "./IncreaseBudgetModal";
import TopupModal from "./TopupModal";
import CurrencyAmount from "./CurrencyAmount";
import MetaSpendingOverview from "./MetaSpendingOverview";
import { formatUsd, resolveUsdToBdtRate, toSafeNumber } from "@/lib/currency";
import { expandAdAccountRequests } from "@/lib/adAccountRequests";

const FILTERS = ["All Accounts", "Ready Accounts", "Pending Setup", "Needs Attention"];
const statCardBaseClass = "dashboard-subpanel overflow-hidden rounded-[28px] border p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]";
const adAccountPageCache = new Map();

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

const getAdStatusMeta = (status) => {
  switch (status) {
    case 1:
      return {
        label: "Active",
        className: "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-accent)] ring-1 ring-[var(--dashboard-frame-border)]",
      };
    case 2:
      return {
        label: "Disabled",
        className: "bg-[var(--dashboard-danger-soft)] text-[#ff8b8b] ring-1 ring-[var(--dashboard-frame-border)]",
      };
    default:
      return {
        label: "Unknown",
        className: "bg-[var(--dashboard-panel-soft)] dashboard-text-muted ring-1 ring-[var(--dashboard-frame-border)]",
      };
  }
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

export default function AdAccountUi({ onRequestNewAccount }) {
  const { token, userData, user } = useFirebaseAuth();
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
    if (!cachedState) {
      didRestoreCacheRef.current = true;
      return;
    }

    setAdAccounts(expandAdAccountRequests(Array.isArray(cachedState.adAccounts) ? cachedState.adAccounts : []));
    setBalances(cachedState.balances && typeof cachedState.balances === "object" ? cachedState.balances : {});
    setFilter(cachedState.filter || "All Accounts");
    setSearchTerm(cachedState.searchTerm || "");
    setListError(cachedState.listError || "");
    setLoading(false);
    didRestoreCacheRef.current = true;
  }, [cacheKey]);

  useEffect(() => {
    if (!didRestoreCacheRef.current || loading) return;

    adAccountPageCache.set(cacheKey, {
      hydrated: true,
      adAccounts,
      balances,
      filter,
      searchTerm,
      listError,
    });
  }, [adAccounts, balances, cacheKey, filter, listError, loading, searchTerm]);

  const loadAccounts = useCallback(async () => {
    if (!token) return;

    try {
      setListError("");
      const res = await fetch("/api/ads-request/list", {
        headers: { Authorization: `Bearer ${token}` },
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
          <MetaSpendingOverview className="p-4 sm:p-6" />

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
                <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                  {filteredAccounts.map((account, i) => {
                    const balance = balances[account.MetaAccountID];
                    const canFetchBalance = isFetchableMetaAccount(account);
                    const hasError = Boolean(balance?.error);
                    const stateMeta = getAccountState(account, balance);
                    const showIncrease = allowBudgetIncrease && (userData?.walletBalance || 0) > 0;
                    const showTopup = allowTopupAction && (userData?.walletBalance || 0) === 0;

                    return (
                      <article
                        key={`${account.MetaAccountID || account._id || i}-${i}`}
                        className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(232,250,218,0.72)_42%,rgba(226,245,255,0.7))] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.08)] ring-1 ring-black/5"
                      >
                        <div className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${getCardTone(stateMeta, hasError, canFetchBalance).accent}`} />
                        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/70 blur-3xl" />
                        <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-cyan-100/80 blur-3xl" />

                        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                            <div className="mb-4 flex items-center gap-3">
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-[0_12px_24px_rgba(15,23,42,0.08)] ${getCardTone(stateMeta, hasError, canFetchBalance).icon}`}
                              >
                                <Building2 size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="dashboard-chip inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
                                  {account.status || "pending"}
                                </div>
                                {account.bundleLead && account.bundleSize > 1 && (
                                  <p className="dashboard-text-faint mt-2 text-[10px] font-black uppercase tracking-[0.18em]">
                                    Bundle of {account.bundleSize} accounts
                                  </p>
                                )}
                              </div>
                            </div>
                            <h4 className="dashboard-text-strong truncate text-lg font-black">
                              {account.accountName || "Unnamed Ad Account"}
                            </h4>
                            <p className="dashboard-text-muted mt-1 truncate font-mono text-xs">
                              {account.MetaAccountID || "Meta ID not assigned yet"}
                            </p>
                          </div>

                          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ring-1 ${stateMeta.tone}`}>
                            {stateMeta.label}
                          </span>
                        </div>

                        <div className="relative mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                          {[
                            {
                              label: "Spend Cap",
                              tone: "text-white",
                              value: balance?.spendCap,
                            },
                            {
                              label: "Spent",
                              tone: "text-rose-300",
                              value: balance?.amountSpent,
                            },
                            {
                              label: "Remaining",
                              tone: "text-emerald-300",
                              value: balance?.remaining,
                            },
                          ].map((item) => {
                            const showUnavailable = hasError || !canFetchBalance;
                            const showLoading = canFetchBalance && balance?.loading;

                            return (
                              <div
                                key={item.label}
                                className={`rounded-[1.45rem] border p-4 shadow-[0_10px_20px_rgba(15,23,42,0.05)] ${getCardTone(stateMeta, hasError, canFetchBalance).stat}`}
                              >
                                <p className="dashboard-text-faint text-[9px] font-bold uppercase tracking-[0.18em]">
                                  {item.label}
                                </p>

                                {showLoading ? (
                                  <div className="mt-3 space-y-2">
                                    <div className="h-5 w-24 animate-pulse rounded bg-[var(--dashboard-frame-border)]" />
                                    <div className="h-4 w-20 animate-pulse rounded bg-[var(--dashboard-panel-soft)]" />
                                  </div>
                                ) : showUnavailable ? (
                                  <div className="mt-3">
                                    <p className="dashboard-text-strong text-[1rem] font-black">Unavailable</p>
                                    <p className="dashboard-text-muted mt-1 text-[11px] leading-5">
                                      {!canFetchBalance
                                        ? "Awaiting valid Meta setup"
                                        : balance?.readableError || balance?.error || "Live Meta balance unavailable"}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="mt-3">
                                    <p className={`text-[1.2rem] font-black leading-none ${item.tone === "text-white" ? "dashboard-text-strong" : item.tone}`}>
                                      {formatUsd(item.value)}
                                    </p>
                                    <div className="mt-1">
                                      <CurrencyAmount
                                        value={item.value}
                                        usdToBdtRate={usdRate}
                                        primaryClassName="hidden"
                                        secondaryClassName="dashboard-text-muted text-[11px] font-semibold"
                                        secondaryPrefix=""
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {account.bundleLead && account.bundleSize > 1 && (
                          <div className="relative mt-4 space-y-3">
                            <p className="dashboard-text-faint text-[10px] font-black uppercase tracking-[0.18em]">
                              Included Accounts
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                              {account.assignedAccounts.map((child, childIndex) => (
                                <div
                                  key={`${account.parentRequestId || account._id}-${child.MetaAccountID || childIndex}`}
                                  className="rounded-[1.25rem] border border-slate-200/70 bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_10px_20px_rgba(15,23,42,0.06)]"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="dashboard-text-strong truncate text-sm font-black">
                                        {child.accountName || `Account ${childIndex + 1}`}
                                      </p>
                                      <p className="dashboard-text-muted mt-1 truncate font-mono text-[11px]">
                                        {child.MetaAccountID || "Meta ID pending"}
                                      </p>
                                    </div>
                                    <span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ring-1 dashboard-chip">
                                      {child.status || "pending"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="relative mt-4 rounded-2xl border border-slate-200/70 bg-[rgba(255,255,255,0.94)] px-4 py-3 shadow-[0_10px_20px_rgba(15,23,42,0.06)]">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white">
                              <ArrowUpRight size={15} className="dashboard-text-muted" />
                            </div>
                            <p className="dashboard-text-muted text-sm">{stateMeta.helper}</p>
                          </div>
                        </div>

                        <div className="relative mt-5 flex flex-wrap justify-start gap-2 sm:justify-end">
                          {showIncrease && canFetchBalance && !hasError && (
                            <button
                              onClick={() =>
                                setIncreaseModal({
                                  open: true,
                                  adAccountId: account?.MetaAccountID,
                                  oldLimit: balance?.spendCap,
                                })
                              }
                              className="dashboard-accent-surface w-full rounded-2xl px-4 py-2.5 text-[11px] font-black transition-all hover:-translate-y-0.5 sm:w-auto"
                            >
                              Increase Budget
                            </button>
                          )}
                          {showTopup && canFetchBalance && !hasError && (
                            <button
                              onClick={() => setTopupModal(true)}
                              className="dashboard-accent-surface w-full rounded-2xl px-4 py-2.5 text-[11px] font-black transition-all hover:-translate-y-0.5 sm:w-auto"
                            >
                              Add Funds
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
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
          setBalances({});
          balancesRef.current = {};
          refreshBalances();
        }}
      />
      <TopupModal open={topupModal} onClose={() => setTopupModal(false)} />
    </>
  );
}
