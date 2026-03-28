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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import IncreaseBudgetModal from "./IncreaseBudgetModal";
import TopupModal from "./TopupModal";
import CurrencyAmount from "./CurrencyAmount";
import { formatUsd, resolveUsdToBdtRate, toSafeNumber } from "@/lib/currency";

const FILTERS = ["All Accounts", "Ready Accounts", "Pending Setup", "Needs Attention"];
const statCardClass =
  "overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,rgba(20,34,63,0.94),rgba(12,23,45,0.96))] p-5 shadow-[0_20px_42px_-28px_rgba(15,23,42,0.88)]";

const getAdStatusMeta = (status) => {
  switch (status) {
    case 1:
      return {
        label: "Active",
        className: "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20",
      };
    case 2:
      return {
        label: "Disabled",
        className: "bg-red-400/10 text-red-200 ring-1 ring-red-400/20",
      };
    default:
      return {
        label: "Unknown",
        className: "bg-slate-400/10 text-slate-200 ring-1 ring-slate-400/20",
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
      tone: "text-slate-200 bg-slate-400/10 ring-slate-400/20",
      helper: "Waiting for a valid active Meta account ID.",
    };
  }

  if (balance?.error) {
    return {
      label: "Needs Attention",
      tone: "text-amber-200 bg-amber-400/10 ring-amber-400/20",
      helper: balance.readableError || balance.error,
    };
  }

  if (!balance || balance.loading) {
    return {
      label: "Syncing",
      tone: "text-sky-200 bg-sky-400/10 ring-sky-400/20",
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
  const { token, userData } = useFirebaseAuth();
  const metaAdsConfig = userData?.metaAdsConfig || {};
  const usdRate = resolveUsdToBdtRate(userData?.currencyConfig?.usdToBdtRate ?? metaAdsConfig.usdRate);
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

  const [increaseModal, setIncreaseModal] = useState({
    open: false,
    adAccountId: null,
    oldLimit: null,
  });
  const [topupModal, setTopupModal] = useState(false);

  useEffect(() => {
    balancesRef.current = balances;
  }, [balances]);

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
    loadAccounts();
  }, [loadAccounts]);

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
      await Promise.all(
        adAccounts
          .filter(isFetchableMetaAccount)
          .map((acc) => fetchBalance(acc.MetaAccountID, true))
      );
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

  const performanceData = useMemo(() => {
    return filteredAccounts
      .filter(isFetchableMetaAccount)
      .map((acc) => {
        const b = balances[acc.MetaAccountID];
        return {
          name: acc.accountName || String(acc.MetaAccountID || "").slice(-5),
          spend: b && !b.error ? toSafeNumber(b.amountSpent) : 0,
          limit: b && !b.error ? toSafeNumber(b.spendCap) : 0,
        };
      });
  }, [filteredAccounts, balances]);

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
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(10,22,47,0.94),rgba(8,17,37,0.94))] p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">
                <Sparkles size={12} />
                Meta Ads Control
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Keep every ad account visible, funded, and ready.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Monitor live spend caps, top up quickly, and act on accounts that still need setup without losing the production flow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[460px]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Ready Accounts</p>
                <p className="mt-2 text-2xl font-black text-white">{accountStats.ready}</p>
                <p className="mt-1 text-xs text-slate-400">Live Meta balances available</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Pending Setup</p>
                <p className="mt-2 text-2xl font-black text-white">{accountStats.pending}</p>
                <p className="mt-1 text-xs text-slate-400">Need active account mapping</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Needs Attention</p>
                <p className="mt-2 text-2xl font-black text-white">{accountStats.issue}</p>
                <p className="mt-1 text-xs text-slate-400">Token or balance sync issue</p>
              </div>
            </div>
          </div>
        </section>

        {listError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-100">
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
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Wallet Balance</p>
                <CurrencyAmount
                  value={userData?.walletBalance}
                  usdToBdtRate={usdRate}
                  primaryClassName="mt-2 text-[1.8rem] font-black leading-none text-white"
                  secondaryClassName="mt-2 text-[12px] font-semibold text-slate-200"
                />
              </div>
              <div className="rounded-2xl bg-blue-400/10 p-3 text-blue-200">
                <Wallet size={20} />
              </div>
            </div>
            <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
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
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
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
                  primaryClassName="mt-2 text-[1.8rem] font-black leading-none text-white"
                  secondaryClassName="mt-2 text-[12px] font-semibold text-slate-200"
                />
              </div>
              <div className="rounded-2xl bg-indigo-400/10 p-3 text-indigo-200">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
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
            <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              Sum of synced active accounts
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(165deg,rgba(17,31,58,0.96),rgba(10,20,40,0.96))] p-6 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-400/10 p-3 text-blue-200">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Spending Overview</h3>
                <p className="text-xs text-slate-400">Live spend tracking across synced accounts</p>
              </div>
            </div>

            {performanceData.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="accountSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7fb3ff" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#7fb3ff" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#23375d" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#93a9d2", fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#93a9d2", fontSize: 11 }}
                      tickFormatter={(val) => formatUsd(val)}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid rgba(127,179,255,0.16)",
                        background: "#0f1d38",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="spend"
                      stroke="#8ab4ff"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#accountSpend)"
                      animationDuration={900}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 text-center">
                <Building2 size={32} className="text-slate-400" />
                <p className="mt-4 font-bold text-white">No synced performance data yet</p>
                <p className="mt-2 max-w-xs text-sm text-slate-400">
                  Once an account is active with a valid Meta account ID, its live spend data will appear here.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(165deg,rgba(17,31,58,0.96),rgba(10,20,40,0.96))] shadow-lg">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                    <ShieldCheck size={12} />
                    Account Workspace
                  </div>
                  <h3 className="text-xl font-black text-white">Ad Accounts</h3>
                  <p className="text-sm text-slate-400">
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
                        className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(155deg,rgba(20,36,66,0.96),rgba(12,24,47,0.96))] p-5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.9)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                              <Building2 size={12} />
                              {account.status || "pending"}
                            </div>
                            <h4 className="truncate text-lg font-black text-white">
                              {account.accountName || "Unnamed Ad Account"}
                            </h4>
                            <p className="mt-1 truncate font-mono text-xs text-slate-400">
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
                                className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-4"
                              >
                                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                  {item.label}
                                </p>

                                {showLoading ? (
                                  <div className="mt-3 space-y-2">
                                    <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
                                    <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
                                  </div>
                                ) : showUnavailable ? (
                                  <div className="mt-3">
                                    <p className="text-[1rem] font-black text-slate-200">Unavailable</p>
                                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                      {!canFetchBalance
                                        ? "Awaiting valid Meta setup"
                                        : balance?.readableError || balance?.error || "Live Meta balance unavailable"}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="mt-3">
                                    <p className={`text-[1.2rem] font-black leading-none ${item.tone}`}>
                                      {formatUsd(item.value)}
                                    </p>
                                    <div className="mt-1">
                                      <CurrencyAmount
                                        value={item.value}
                                        usdToBdtRate={usdRate}
                                        primaryClassName="hidden"
                                        secondaryClassName="text-[11px] font-semibold text-slate-400"
                                        secondaryPrefix=""
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f1d38]/90 px-4 py-3">
                          <div className="flex items-start gap-2">
                            <ArrowUpRight size={15} className="mt-0.5 shrink-0 text-blue-300" />
                            <p className="text-sm text-slate-300">{stateMeta.helper}</p>
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
                              className="rounded-2xl bg-blue-500 px-4 py-2.5 text-[11px] font-black text-white transition-all hover:bg-blue-600"
                            >
                              Increase Budget
                            </button>
                          )}
                          {showTopup && canFetchBalance && !hasError && (
                            <button
                              onClick={() => setTopupModal(true)}
                              className="rounded-2xl bg-amber-500 px-4 py-2.5 text-[11px] font-black text-white transition-all hover:bg-amber-600"
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
          setBalances({});
          refreshBalances();
        }}
      />
      <TopupModal open={topupModal} onClose={() => setTopupModal(false)} />
    </>
  );
}
