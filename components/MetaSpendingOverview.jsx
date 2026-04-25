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
import { Banknote, Building2, TrendingUp, Wallet } from "lucide-react";
import useAppAuth from "@/hooks/useAppAuth";
import { formatBdt, formatUsd, resolveUsdToBdtRate, toSafeNumber } from "@/lib/currency";

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

const resolveSummaryUsdToBdtRate = (assignedUsdToBdtRate, profileUsdToBdtRate) => {
  const assigned = toSafeNumber(assignedUsdToBdtRate);
  if (assigned > 0) {
    return {
      rate: assigned,
      source: "assigned",
      meta: "Account rate",
      helper: "Admin-set conversion for your assigned Meta ad account(s).",
    };
  }
  const rate = resolveUsdToBdtRate(profileUsdToBdtRate);
  return {
    rate,
    source: "profile",
    meta: "Default rate",
    helper: "",
  };
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
    if (nextValue >= existingValue) map.set(item.id, item);
  });
  return Array.from(map.values());
};

const METRIC_TABS = [
  { key: "spend", label: "Spent" },
  { key: "remaining", label: "Remaining" },
  { key: "spendCap", label: "Cap" },
];

const METRIC_STYLES = {
  spend: {
    stroke: "#2563eb",
    gradientStart: "rgba(37, 99, 235, 0.35)",
    gradientEnd: "rgba(37, 99, 235, 0.03)",
    grid: "rgba(148, 163, 184, 0.14)",
  },
  remaining: {
    stroke: "#0f766e",
    gradientStart: "rgba(15, 118, 110, 0.3)",
    gradientEnd: "rgba(15, 118, 110, 0.03)",
    grid: "rgba(148, 163, 184, 0.14)",
  },
  spendCap: {
    stroke: "#7c3aed",
    gradientStart: "rgba(124, 58, 237, 0.32)",
    gradientEnd: "rgba(124, 58, 237, 0.03)",
    grid: "rgba(148, 163, 184, 0.14)",
  },
};

function CustomTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  const metricLabel = METRIC_TABS.find((item) => item.key === metric)?.label || "Spent";

  return (
    <div className="min-w-[220px] rounded-[20px] border border-slate-200 bg-white p-4 text-slate-800 shadow-[0_22px_55px_rgba(15,23,42,0.12)]">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-900">{formatUsd(data[metric])}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{metricLabel} for this account</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl bg-blue-50 px-3 py-2">
          <p className="font-bold uppercase tracking-[0.14em] text-blue-600">Spent</p>
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

function SpendingSummaryCard({ title, value, helper, meta, icon: Icon, tone, valueClassName = "" }) {
  return (
    <article
      className={`dashboard-subpanel meta-summary-card meta-summary-card--${tone} group relative overflow-hidden rounded-[28px] border p-5 transition hover:-translate-y-0.5`}
    >
      <div className="meta-summary-card__glow absolute inset-0 opacity-0 transition group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="meta-summary-card__badge inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
              {title}
            </div>
            <p
              className={`meta-summary-card__value mt-4 break-words text-[2rem] font-black leading-tight ${valueClassName}`.trim()}
            >
              {value}
            </p>
            <p className="meta-summary-card__helper mt-2 text-sm font-semibold leading-6">{helper}</p>
          </div>
          <div className="meta-summary-card__icon flex h-12 w-12 items-center justify-center rounded-2xl">
            <Icon size={18} />
          </div>
        </div>

        {meta ? (
          <div className="mt-5">
            <p className="meta-summary-card__meta rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.16em]">{meta}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function useMetaSpendingOverviewData() {
  const { token } = useAppAuth();
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
    if (!chartData.length) return { totalSpend: 0, totalRemaining: 0, totalCap: 0, peakAccount: null };
    const totalSpend = chartData.reduce((sum, item) => sum + toSafeNumber(item.spend), 0);
    const totalRemaining = chartData.reduce((sum, item) => sum + toSafeNumber(item.remaining), 0);
    const totalCap = chartData.reduce((sum, item) => sum + toSafeNumber(item.spendCap), 0);
    const peakAccount = [...chartData].sort((a, b) => toSafeNumber(b[activeMetric]) - toSafeNumber(a[activeMetric]))[0] || null;
    return { totalSpend, totalRemaining, totalCap, peakAccount };
  }, [activeMetric, chartData]);

  const highlightedAccountId = React.useMemo(() => {
    if (!chartData.length) return null;
    return [...chartData].sort((a, b) => toSafeNumber(b[activeMetric]) - toSafeNumber(a[activeMetric]))[0]?.id || null;
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

  return {
    loading,
    activeMetric,
    setActiveMetric,
    chartData,
    summary,
    highlightedAccountId,
  };
}

export function MetaSpendingSummaryCardsPanel({
  className = "",
  dataState,
  assignedUsdToBdtRate,
  profileUsdToBdtRate,
}) {
  const { loading, chartData, summary, activeMetric } = dataState;
  const rateInfo = resolveSummaryUsdToBdtRate(assignedUsdToBdtRate, profileUsdToBdtRate);
  const rateDisplay = `1 USD = ${formatBdt(rateInfo.rate, { round: false })}`;

  const gridClass = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";

  if (loading) {
    return (
      <div className={`${gridClass} ${className}`.trim()}>
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="dashboard-subpanel h-[176px] animate-pulse rounded-[28px] border border-white/10 bg-[var(--dashboard-panel-soft)]" />
        ))}
      </div>
    );
  }

  return (
    <div className={`${gridClass} ${className}`.trim()}>
      <SpendingSummaryCard
        title="Total Spent"
        value={chartData.length ? formatUsd(summary.totalSpend) : formatUsd(0)}
        helper="Live amount spent across synced accounts"
        icon={TrendingUp}
        tone="spend"
      />
      <SpendingSummaryCard
        title="Remaining"
        value={chartData.length ? formatUsd(summary.totalRemaining) : formatUsd(0)}
        helper="Available budget still left to spend"
        icon={Wallet}
        tone="remaining"
      />
      <SpendingSummaryCard
        title="Top Account"
        value={chartData.length ? summary.peakAccount?.name || "No data" : "No data"}
        helper={
          chartData.length && summary.peakAccount
            ? `${formatUsd(summary.peakAccount[activeMetric])} on current metric`
            : "Waiting for synced balances"
        }
        icon={Building2}
        tone="peak"
      />
      <SpendingSummaryCard
        title="USD → BDT"
        value={rateDisplay}
        helper={rateInfo.helper}
        meta={rateInfo.meta}
        icon={Banknote}
        tone="rate"
        valueClassName="!text-[1.15rem] sm:!text-[1.35rem] xl:!text-[1.55rem]"
      />
    </div>
  );
}

export function MetaSpendingSummaryCards({ className = "", assignedUsdToBdtRate, profileUsdToBdtRate }) {
  const dataState = useMetaSpendingOverviewData();
  return (
    <MetaSpendingSummaryCardsPanel
      className={className}
      dataState={dataState}
      assignedUsdToBdtRate={assignedUsdToBdtRate}
      profileUsdToBdtRate={profileUsdToBdtRate}
    />
  );
}

export function MetaSpendingOverviewPanel({
  className = "",
  showSummaryCards = true,
  dataState,
  assignedUsdToBdtRate,
  profileUsdToBdtRate,
}) {
  const { loading, chartData, activeMetric, setActiveMetric, highlightedAccountId } = dataState;
  const metricLabel = METRIC_TABS.find((item) => item.key === activeMetric)?.label || "Spent";
  const chartGradientId = React.useId().replace(/:/g, "");
  const activeMetricStyle = METRIC_STYLES[activeMetric] || METRIC_STYLES.spend;

  return (
    <section
      className={`relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.72),_rgba(255,255,255,0.95)_34%,_rgba(248,250,252,0.98)_100%)] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-5 ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(241,245,249,0.18))]" />

      <div className="relative z-10">
        {showSummaryCards ? (
          <MetaSpendingSummaryCardsPanel
            dataState={dataState}
            className="mb-6"
            assignedUsdToBdtRate={assignedUsdToBdtRate}
            profileUsdToBdtRate={profileUsdToBdtRate}
          />
        ) : null}

        {loading ? (
          <div className="flex h-[320px] items-center justify-center rounded-[28px] border border-slate-200 bg-white/75 text-sm font-semibold text-slate-500">
            Loading spending data...
          </div>
        ) : chartData.length > 0 ? (
          <>
            <div className="mb-4 flex flex-col gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-600">Spending Overview</p>
                <h3 className="mt-2 text-[1.35rem] font-black tracking-tight text-slate-900 sm:text-[1.5rem]">
                  Cap by ad account for the current billing cycle
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Switch the metric to review spend, remaining budget, or cap across active accounts.
                </p>
              </div>
              <div className="min-w-[180px]">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Metric
                </label>
                <select
                  value={activeMetric}
                  onChange={(event) => setActiveMetric(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  aria-label="Select spending metric"
                >
                  {METRIC_TABS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/75 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: activeMetricStyle.stroke }}
                  />
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {metricLabel} focus
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400">
                  Highlighting the strongest account in the selected metric
                </p>
              </div>

              <div className="h-[290px] sm:h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 18, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={activeMetricStyle.gradientStart} stopOpacity={1} />
                        <stop offset="100%" stopColor={activeMetricStyle.gradientEnd} stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={activeMetricStyle.grid} strokeDasharray="4 8" />
                    <XAxis
                      dataKey="shortName"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={12}
                      minTickGap={24}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip
                      content={<CustomTooltip metric={activeMetric} />}
                      cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Area
                      type="natural"
                      dataKey={activeMetric}
                      stroke={activeMetricStyle.stroke}
                      strokeWidth={3.5}
                      fill={`url(#${chartGradientId})`}
                      fillOpacity={1}
                      animationDuration={900}
                      activeDot={{ r: 6, fill: activeMetricStyle.stroke, stroke: "#ffffff", strokeWidth: 2.5 }}
                      dot={{ r: 0 }}
                    >
                      <LabelList
                        dataKey={activeMetric}
                        content={({ x, y, value, index }) => {
                          const point = chartData[index];
                          if (!point || point.id !== highlightedAccountId) return null;
                          return (
                            <g>
                              <circle cx={x} cy={y} r={5} fill={activeMetricStyle.stroke} stroke="#ffffff" strokeWidth={3} />
                              <text
                                x={x}
                                y={y - 14}
                                textAnchor="middle"
                                fill={activeMetricStyle.stroke}
                                fontSize="11"
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
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-500">
              <span className="font-semibold">
                Data points: {chartData.length} active accounts
              </span>
              <span className="font-semibold">
                Top account: {chartData.find((item) => item.id === highlightedAccountId)?.name || "No data"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/75 text-center">
            <span className="dashboard-accent-surface inline-flex h-14 w-14 items-center justify-center rounded-2xl">
              <Building2 size={28} className="text-[var(--dashboard-accent-text)]" />
            </span>
            <p className="mt-4 text-lg font-black text-slate-900">No account data available yet</p>
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              Activate at least one Meta ad account with a valid account ID to see budget metrics here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function MetaSpendingOverview(props) {
  const { assignedUsdToBdtRate, profileUsdToBdtRate, ...rest } = props;
  const dataState = useMetaSpendingOverviewData();
  return (
    <MetaSpendingOverviewPanel
      {...rest}
      dataState={dataState}
      assignedUsdToBdtRate={assignedUsdToBdtRate}
      profileUsdToBdtRate={profileUsdToBdtRate}
    />
  );
}
