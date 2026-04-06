"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Search,
  RefreshCw,
  Loader2,
  DollarSign,
  CreditCard,
  Wallet,
  TrendingUp,
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

const FILTERS = ["All Accounts", "Ready Accounts", "Pending Setup", "Needs Attention"];
const statCardClass = "dashboard-subpanel overflow-hidden rounded-[1.75rem] p-5";
const adAccountPageCache = new Map();

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

export default function AdAccountUi() {
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

    setAdAccounts(Array.isArray(cachedState.adAccounts) ? cachedState.adAccounts : []);
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
      setAdAccounts(Array.isArray(json.data) ? json.data : []);
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
      setAdAccounts(freshAccounts);
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
        <section className="dashboard-subpanel overflow-hidden rounded-[2rem] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="dashboard-chip mb-3 inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
                <Sparkles size={12} />
                Meta Ads Control
              </div>
              <h2 className="dashboard-text-strong text-3xl font-black tracking-tight sm:text-4xl">
                Keep every ad account visible, funded, and ready.
              </h2>
              <p className="dashboard-text-muted mt-3 text-sm leading-6">
                Monitor live spend caps, top up quickly, and act on accounts that still need setup without losing the production flow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[460px]">
              <div className="dashboard-subpanel rounded-2xl p-4">
                <p className="dashboard-text-faint text-[11px] font-bold uppercase tracking-[0.18em]">Ready Accounts</p>
                <p className="dashboard-text-strong mt-2 text-2xl font-black">{accountStats.ready}</p>
                <p className="dashboard-text-muted mt-1 text-xs">Live Meta balances available</p>
              </div>
              <div className="dashboard-subpanel rounded-2xl p-4">
                <p className="dashboard-text-faint text-[11px] font-bold uppercase tracking-[0.18em]">Pending Setup</p>
                <p className="dashboard-text-strong mt-2 text-2xl font-black">{accountStats.pending}</p>
                <p className="dashboard-text-muted mt-1 text-xs">Need active account mapping</p>
              </div>
              <div className="dashboard-subpanel rounded-2xl p-4">
                <p className="dashboard-text-faint text-[11px] font-bold uppercase tracking-[0.18em]">Needs Attention</p>
                <p className="dashboard-text-strong mt-2 text-2xl font-black">{accountStats.issue}</p>
                <p className="dashboard-text-muted mt-1 text-xs">Token or balance sync issue</p>
              </div>
            </div>
          </div>
        </section>

        {listError && (
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-danger-soft)] p-4 text-[#ff8b8b]">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Couldn&apos;t load ad account requests</p>
              <p className="mt-1 text-sm text-red-100/80">{listError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className={statCardClass}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="dashboard-text-faint text-[11px] font-bold uppercase tracking-[0.18em]">Wallet Balance</p>
                <CurrencyAmount
                  value={userData?.walletBalance}
                  usdToBdtRate={usdRate}
                  primaryClassName="dashboard-text-strong mt-2 text-[1.8rem] font-black leading-none"
                  secondaryClassName="dashboard-text-muted mt-2 text-[12px] font-semibold"
                />
              </div>
              <div className="dashboard-subpanel rounded-2xl p-3 dashboard-text-muted">
                <Wallet size={20} />
              </div>
            </div>
            <div className="dashboard-chip inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
              Available for budget increase
            </div>
          </div>

          <div className={statCardClass}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">USD Rate</p>
                <CurrencyAmount
                  value={usdRate}
                  usdToBdtRate={usdRate}
                  asRate
                  primaryClassName="mt-2 text-[1.8rem] font-black leading-none text-white"
                  secondaryClassName="mt-2 text-[12px] font-semibold text-slate-200"
                />
              </div>
              <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-200">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ">
              BDT to USD working rate
            </div>
          </div>

          <div className={statCardClass}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Top Up Balance</p>
                <CurrencyAmount
                  value={userData?.topupBalance}
                  usdToBdtRate={usdRate}
                  primaryClassName="mt-2 text-[1.8rem] font-black leading-none "
                  secondaryClassName="mt-2 text-[12px] font-semibold text-slate-200"
                />
              </div>
              <div className="rounded-2xl bg-indigo-400/10 p-3 text-indigo-200">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ">
              Cumulative wallet top-ups
            </div>
          </div>

          <div className={statCardClass}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Remaining Budget</p>
                <CurrencyAmount
                  value={remainingDisplay}
                  usdToBdtRate={usdRate}
                  primaryClassName="mt-2 text-[1.8rem] font-black leading-none text-white"
                  secondaryClassName="mt-2 text-[12px] font-semibold text-slate-200"
                />
              </div>
              <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-200">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em">
              Sum of synced active accounts
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <MetaSpendingOverview className="p-6" />

          <section className="rounded-[2rem]">
            <div className="px-1 py-1">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="dashboard-chip mb-2 inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                    <ShieldCheck size={12} />
                    Account Workspace
                  </div>
                  <h3 className="dashboard-text-strong text-xl font-black">Ad Accounts</h3>
                  <p className="dashboard-text-muted text-sm">
                    Review account readiness, balance sync, and available actions from one workspace.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      placeholder="Search account..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#132546] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20 sm:w-60"
                    />
                  </div>

                  <div className="relative">
                    <select
                      className="appearance-none rounded-xl border border-white/10 bg-[#132546] py-2.5 pl-4 pr-10 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-900 transition-all hover:bg-slate-100 disabled:opacity-60"
                  >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {filteredAccounts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-14 text-center">
                  <Building2 size={30} className="mx-auto text-slate-400" />
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
                        className="dashboard-subpanel overflow-hidden rounded-[1.75rem] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="dashboard-chip mb-3 inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
                              <Building2 size={12} />
                              {account.status || "pending"}
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

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
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
                                className="dashboard-subpanel rounded-[1.35rem] p-4"
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

                        <div className="dashboard-subpanel mt-4 rounded-2xl px-4 py-3">
                          <div className="flex items-start gap-2">
                            <ArrowUpRight size={15} className="mt-0.5 shrink-0 dashboard-text-muted" />
                            <p className="dashboard-text-muted text-sm">{stateMeta.helper}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap justify-end gap-2">
                          {showIncrease && canFetchBalance && !hasError && (
                            <button
                              onClick={() =>
                                setIncreaseModal({
                                  open: true,
                                  adAccountId: account?.MetaAccountID,
                                  oldLimit: balance?.spendCap,
                                })
                              }
                              className="dashboard-accent-surface rounded-2xl px-4 py-2.5 text-[11px] font-black transition-all"
                            >
                              Increase Budget
                            </button>
                          )}
                          {showTopup && canFetchBalance && !hasError && (
                            <button
                              onClick={() => setTopupModal(true)}
                              className="dashboard-accent-surface rounded-2xl px-4 py-2.5 text-[11px] font-black transition-all"
                            >
                              Top Up Wallet
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
