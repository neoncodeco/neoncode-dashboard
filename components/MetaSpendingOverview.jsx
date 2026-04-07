"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, Sparkles, TrendingUp, Wallet } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { formatUsd, toSafeNumber } from "@/lib/currency";

const normalizeAdAccountId = (value) => String(value || "").replace(/^act_/, "").trim();

const isFetchableMetaAccount = (account) => {
  const status = String(account?.status || "").toLowerCase();
  const cleanId = normalizeAdAccountId(account?.MetaAccountID);
  return status === "active" && /^\d{8,}$/.test(cleanId);
};

const formatChartUsd = (value) => {
  const amount = toSafeNumber(value);

  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  if (amount >= 100) return `$${Math.round(amount)}`;
  return `$${amount.toFixed(2)}`;
};

const formatAccountLabel = (value) => {
  const label = String(value || "").trim();
  return label.length > 10 ? `${label.slice(0, 10)}...` : label;
};

const dedupeAccountsById = (items) => {
  const map = new Map();

  items.forEach((item) => {
    if (!item?.id) return;

    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }

    const existingValue = toSafeNumber(existing.spendCap) + toSafeNumber(existing.spend) + toSafeNumber(existing.remaining);
    const nextValue = toSafeNumber(item.spendCap) + toSafeNumber(item.spend) + toSafeNumber(item.remaining);

    if (nextValue >= existingValue) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
};

const METRIC_TABS = [
  { key: "spend", label: "Spent" },
  { key: "remaining", label: "Remaining" },
  { key: "spendCap", label: "Cap" },
];

function CustomTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const metricLabel = METRIC_TABS.find((item) => item.key === metric)?.label || "Spent";

  return (
    <div className="min-w-[220px] rounded-[20px] border border-sky-200/60 bg-white/95 p-4 text-slate-800 shadow-[0_22px_55px_rgba(56,189,248,0.14)] backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-900">{formatUsd(data[metric])}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{metricLabel} for this account</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl bg-sky-50 px-3 py-2">
          <p className="font-bold uppercase tracking-[0.14em] text-sky-600">Spent</p>
          <p className="mt-1 font-black text-slate-900">{formatUsd(data.spend)}</p>
        </div>
        <div className="rounded-2xl bg-teal-50 px-3 py-2">
          <p className="font-bold uppercase tracking-[0.14em] text-teal-600">Remaining</p>
          <p className="mt-1 font-black text-slate-900">{formatUsd(data.remaining)}</p>
        </div>
      </div>
    </div>
  );
}

export default function MetaSpendingOverview({ className = "" }) {
  const spendGradientId = React.useId().replace(/:/g, "");
  const glowGradientId = React.useId().replace(/:/g, "");
  const { token } = useFirebaseAuth();
  const [performanceData, setPerformanceData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [activeMetric, setActiveMetric] = React.useState("spend");

  const chartData = React.useMemo(
    () =>
      performanceData.map((item, index) => ({
        ...item,
        order: index + 1,
        shortName: formatAccountLabel(item.name),
      })),
    [performanceData]
  );

  const summary = React.useMemo(() => {
    if (!chartData.length) {
      return {
        totalSpend: 0,
        totalRemaining: 0,
        totalCap: 0,
        peakAccount: null,
      };
    }

    const totalSpend = chartData.reduce((sum, item) => sum + toSafeNumber(item.spend), 0);
    const totalRemaining = chartData.reduce((sum, item) => sum + toSafeNumber(item.remaining), 0);
    const totalCap = chartData.reduce((sum, item) => sum + toSafeNumber(item.spendCap), 0);
    const peakAccount = [...chartData].sort((a, b) => toSafeNumber(b[activeMetric]) - toSafeNumber(a[activeMetric]))[0] || null;

    return {
      totalSpend,
      totalRemaining,
      totalCap,
      peakAccount,
    };
  }, [activeMetric, chartData]);

  const maxMetricValue = React.useMemo(
    () => chartData.reduce((max, item) => Math.max(max, toSafeNumber(item[activeMetric])), 0),
    [activeMetric, chartData]
  );

  const highlightedAccountId = React.useMemo(() => {
    if (!chartData.length) return null;
    return (
      [...chartData].sort(
        (a, b) => toSafeNumber(b[activeMetric]) - toSafeNumber(a[activeMetric])
      )[0]?.id || null
    );
  }, [activeMetric, chartData]);

  React.useEffect(() => {
    if (!token) return;

    let active = true;

    const loadData = async () => {
      try {
        const res = await fetch("/api/ads-request/list", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json?.ok || !active) return;

        const accounts = Array.isArray(json.data) ? json.data.filter(isFetchableMetaAccount) : [];
        const nextData = await Promise.all(
          accounts.map(async (account) => {
            const cleanAdId = normalizeAdAccountId(account.MetaAccountID);

            try {
              const balanceRes = await fetch(`/api/ads-request/balance?ad_account_id=${cleanAdId}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
              });
              const balanceJson = await balanceRes.json();
              if (!balanceRes.ok) return null;

              return {
                id: cleanAdId,
                name: account.accountName || String(account.MetaAccountID || "").slice(-5),
                spend: toSafeNumber(balanceJson.amountSpent),
                remaining: toSafeNumber(balanceJson.remaining),
                spendCap: toSafeNumber(balanceJson.spendCap),
              };
            } catch {
              return null;
            }
          })
        );

        if (!active) return;
        setPerformanceData(dedupeAccountsById(nextData.filter(Boolean)));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section
      className={`dashboard-subpanel relative overflow-hidden rounded-[30px] border border-cyan-200/20 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_rgba(255,255,255,0.96)_34%,_rgba(240,249,255,0.98)_100%)] p-5 shadow-[0_28px_70px_rgba(125,211,252,0.12)] sm:p-6 ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(240,249,255,0.28))]" />

      <div className="relative z-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 shadow-sm">
              <Sparkles size={12} />
              Spending Overview
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-[2rem]">
              Spending overview  
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Track how much each account has spent, how much budget is still remaining, and where the biggest movement is happening right now.
            </p>
          </div>

          {!loading && chartData.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[430px]">
              <div className="rounded-[24px] border border-sky-200/70 bg-white/82 p-4 shadow-[0_16px_35px_rgba(56,189,248,0.08)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Total Spent</p>
                  <TrendingUp size={16} className="text-sky-500" />
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">{formatUsd(summary.totalSpend)}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Live amount spent across synced accounts</p>
              </div>

              <div className="rounded-[24px] border border-teal-200/70 bg-white/82 p-4 shadow-[0_16px_35px_rgba(20,184,166,0.08)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Remaining</p>
                  <Wallet size={16} className="text-teal-500" />
                </div>
                <p className="mt-3 text-2xl font-black text-slate-900">{formatUsd(summary.totalRemaining)}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Available budget still left to spend</p>
              </div>

              <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 shadow-[0_16px_35px_rgba(15,23,42,0.06)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Top Account</p>
                  <Building2 size={16} className="text-slate-500" />
                </div>
                <p className="mt-3 truncate text-lg font-black text-slate-900">
                  {summary.peakAccount?.name || "No data"}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {summary.peakAccount ? `${formatUsd(summary.peakAccount[activeMetric])} on current metric` : "Waiting for synced balances"}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-6 flex h-[320px] items-center justify-center rounded-[28px] border border-cyan-100 bg-white/70 text-sm font-semibold text-slate-500">
            Loading spending data...
          </div>
        ) : chartData.length > 0 ? (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {METRIC_TABS.map((item) => {
                const isActive = item.key === activeMetric;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveMetric(item.key)}
                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${
                      isActive
                        ? "border-sky-500 bg-sky-500 text-white shadow-[0_12px_28px_rgba(56,189,248,0.22)]"
                        : "border-sky-200 bg-white/82 text-sky-600 hover:border-sky-300 hover:bg-sky-50"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-[30px] border border-cyan-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.9))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-500">
                    Live Curve
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {METRIC_TABS.find((item) => item.key === activeMetric)?.label} by ad account
                  </p>
                </div>
                <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-bold text-slate-600">
                  Budget cap: <span className="font-black text-slate-900">{formatUsd(summary.totalCap)}</span>
                </div>
              </div>

              <div className="dashboard-analytics-grid h-[320px] rounded-[24px] bg-[linear-gradient(180deg,rgba(236,254,255,0.92),rgba(248,250,252,0.9))] px-2 py-3 sm:h-[360px] sm:px-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 18, right: 18, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id={spendGradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.24} />
                        <stop offset="65%" stopColor="#7dd3fc" stopOpacity={0.11} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id={glowGradientId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>

                    <CartesianGrid vertical={false} strokeDasharray="0" stroke="rgba(148,163,184,0.18)" />
                    <XAxis
                      dataKey="shortName"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#7c8aa5", fontSize: 11, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      width={58}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#8b9ab3", fontSize: 11, fontWeight: 600 }}
                      tickFormatter={formatChartUsd}
                      domain={[0, Math.max(maxMetricValue * 1.18, 1)]}
                    />
                    <Tooltip content={<CustomTooltip metric={activeMetric} />} cursor={{ stroke: "rgba(56,189,248,0.18)", strokeWidth: 1 }} />
                    <Area
                      type="natural"
                      dataKey={activeMetric}
                      stroke={`url(#${glowGradientId})`}
                      strokeWidth={3.5}
                      fill={`url(#${spendGradientId})`}
                      fillOpacity={1}
                      animationDuration={950}
                      activeDot={{
                        r: 6,
                        fill: "#0ea5e9",
                        stroke: "#ffffff",
                        strokeWidth: 3,
                      }}
                      dot={{
                        r: 0,
                        strokeWidth: 0,
                      }}
                    >
                      <LabelList
                        dataKey={activeMetric}
                        content={({ x, y, value, index }) => {
                          const point = chartData[index];
                          if (!point || point.id !== highlightedAccountId) return null;

                          return (
                            <g>
                              <circle cx={x} cy={y} r={5} fill="#0ea5e9" stroke="#ffffff" strokeWidth={3} />
                              <text
                                x={x}
                                y={y - 18}
                                textAnchor="middle"
                                fill="#475569"
                                fontSize="12"
                                fontWeight="800"
                              >
                                {formatChartUsd(value)}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {chartData.slice(0, 3).map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="rounded-[24px] border border-slate-200/70 bg-white/85 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
                  >
                    <p className="truncate text-sm font-black text-slate-900">{item.name}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-[0.16em] text-sky-600">Spent</span>
                      <span className="font-black text-slate-900">{formatUsd(item.spend)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-[0.16em] text-teal-600">Remaining</span>
                      <span className="font-black text-slate-900">{formatUsd(item.remaining)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 flex h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-cyan-200 bg-white/70 text-center">
            <Building2 size={30} className="text-slate-400" />
            <p className="mt-4 text-lg font-black text-slate-900">No synced performance data yet</p>
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              Once an account is active with a valid Meta account ID, both spent and remaining budget will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
