"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  LineChart as LineChartIcon,
  Wallet,
  Users,
  ShieldCheck,
  ReceiptText,
  BadgeDollarSign,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import CurrencyAmount from "@/components/CurrencyAmount";
import {
  MetaSpendingOverviewPanel,
  MetaSpendingSummaryCardsPanel,
  useMetaSpendingOverviewData,
} from "@/components/MetaSpendingOverview";
import { formatUsd, resolveUsdToBdtRate } from "@/lib/currency";
const FUND_COLORS = ["#B7DF69", "#8ED868", "#73C8FF", "#67A3FF", "#A4E05F"];
const TOPUP_CHART_COLOR = "#9BC44F";
const TOPUP_CHART_TINT = "rgba(155, 196, 79, 0.14)";
const TOPUP_CHART_TINT_SOFT = "rgba(155, 196, 79, 0.03)";

const formatShortDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

const formatLongDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function MetricCard({ title, value, subtext, icon: Icon, tone = "default" }) {
  const toneClass =
    tone === "accent"
      ? "!border-emerald-300/45 !bg-[linear-gradient(135deg,rgba(183,223,105,0.34),rgba(183,223,105,0.12)_48%,rgba(255,255,255,0.96))]"
      : tone === "soft"
      ? "!border-sky-300/45 !bg-[linear-gradient(135deg,rgba(115,200,255,0.28),rgba(115,200,255,0.12)_50%,rgba(255,255,255,0.96))]"
      : "!border-indigo-300/40 !bg-[linear-gradient(135deg,rgba(103,163,255,0.28),rgba(103,163,255,0.1)_52%,rgba(255,255,255,0.96))]";

  return (
    <div className={`dashboard-subpanel rounded-[28px] border p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold dashboard-text-muted">{title}</p>
          <div className="mt-2 text-[1.65rem] font-black leading-none dashboard-text-strong">{value}</div>
          <p className="mt-2 text-sm dashboard-text-muted">{subtext}</p>
        </div>
        <div className="dashboard-accent-surface flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-white">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--dashboard-frame-border)] py-3 last:border-b-0">
      <span className="text-[11px] font-black uppercase tracking-[0.18em] dashboard-text-faint">{label}</span>
      <span className="truncate text-sm font-semibold dashboard-text-strong">{value}</span>
    </div>
  );
}

function EmptyChartState({ title, message }) {
  return (
    <div className="flex h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)] px-6 text-center">
      <div className="dashboard-accent-surface mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        <LineChartIcon size={22} />
      </div>
      <h3 className="text-lg font-black dashboard-text-strong">{title}</h3>
      <p className="mt-2 max-w-sm text-sm dashboard-text-muted">{message}</p>
    </div>
  );
}

export default function OverviewPage() {
  const { userData, token } = useFirebaseAuth();
  const spendingOverview = useMetaSpendingOverviewData();
  const [topupHistory, setTopupHistory] = React.useState([]);
  const [topupCount, setTopupCount] = React.useState(0);
  const [lastTopupDate, setLastTopupDate] = React.useState("");

  React.useEffect(() => {
    if (!token) return;

    let active = true;

    const loadTopupHistory = async () => {
      try {
        const res = await fetch("/api/payment/payhistory", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json?.ok || !active) return;

        const approvedItems = (json.data || [])
          .filter((item) => item.status === "approved" && item.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setTopupCount(approvedItems.length);

        if (approvedItems.length > 0) {
          setLastTopupDate(formatLongDate(approvedItems[approvedItems.length - 1].date));
        }

        const dailyMap = approvedItems.reduce((acc, item) => {
          const date = new Date(item.date);
          const key = date.toISOString().slice(0, 10);
          if (!acc[key]) {
            acc[key] = {
              date: key,
              label: formatShortDate(date),
              total: 0,
            };
          }
          acc[key].total += Number(item.amount || 0);
          return acc;
        }, {});

        const historyData = Object.values(dailyMap).slice(-7);
        setTopupHistory(historyData);
      } catch (error) {
        console.error("Failed to load topup history:", error);
      }
    };

    void loadTopupHistory();

    return () => {
      active = false;
    };
  }, [token]);

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[var(--dashboard-accent)]" />
      </div>
    );
  }

  const stats = userData.referralStats || {};
  const usdToBdtRate = resolveUsdToBdtRate(userData?.currencyConfig?.usdToBdtRate);

  const totalPayout = Number(stats.totalPayout || 0);
  const totalReferrers = Number(stats.totalReferrers || 0);
  const totalReferIncome = Number(stats.totalReferIncome || 0);
  const totalTopup = Number(userData.topupBalance || 0);
  const totalWallet = Number(userData.walletBalance || 0);
  const totalFunds = totalWallet + totalTopup + totalReferIncome + totalPayout;
  const firstTopupPoint = topupHistory[0]?.total || 0;
  const lastTopupPoint = topupHistory[topupHistory.length - 1]?.total || 0;
  const trendPercent =
    firstTopupPoint > 0
      ? ((lastTopupPoint - firstTopupPoint) / firstTopupPoint) * 100
      : lastTopupPoint > 0
      ? 100
      : 0;
  const isTrendPositive = trendPercent >= 0;
  const topupPeriodLabel =
    topupHistory.length > 1
      ? `${topupHistory[0].label} - ${topupHistory[topupHistory.length - 1].label}`
      : topupHistory[0]?.label || "Last approved payment day";

  const pieData = [
    { name: "Wallet", value: totalWallet },
    { name: "Topup", value: totalTopup },
    { name: "Referral", value: totalReferIncome },
    { name: "Payout", value: totalPayout },
  ].filter((item) => item.value > 0);

  const accountHealth = [
    {
      label: "Account Status",
      value: userData.status || "Active",
    },
    {
      label: "Role",
      value: userData.role || "user",
    },
    {
      label: "Referral Code",
      value: userData.referralCode || "Not set",
    },
    {
      label: "Member Since",
      value: userData.createdAt ? formatLongDate(userData.createdAt) : "Unknown",
    },
  ];

  const quickLinks = [
    { label: "Payment Methods", href: "/user-dashboard/payment-methods", icon: CreditCard },
    { label: "Activity History", href: "/user-dashboard/history", icon: ReceiptText },
    { label: "Meta Ads Accounts", href: "/user-dashboard/meta-ads-account", icon: BadgeDollarSign },
    { label: "Support", href: "/user-dashboard/support", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 lg:space-y-8 lg:p-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Wallet Balance"
          value={<CurrencyAmount value={userData.walletBalance} usdToBdtRate={usdToBdtRate} showSecondary={false} primaryClassName="text-[1.65rem] font-black leading-none dashboard-text-strong" />}
          subtext="Current cash available in your account"
          icon={Wallet}
          tone="accent"
        />
        <MetricCard
          title="Topup Balance"
          value={<CurrencyAmount value={userData.topupBalance} usdToBdtRate={usdToBdtRate} showSecondary={false} primaryClassName="text-[1.65rem] font-black leading-none dashboard-text-strong" />}
          subtext={lastTopupDate ? `Last approved on ${lastTopupDate}` : "No approved topup yet"}
          icon={BadgeDollarSign}
          tone="soft"
        />
        <MetricCard
          title="Referral Income"
          value={formatUsd(totalReferIncome)}
          subtext={`${totalReferrers} active referrals`}
          icon={Users}
          tone="soft"
        />
        <MetricCard
          title="Payout Total"
          value={formatUsd(totalPayout)}
          subtext="Completed payout value"
          icon={CreditCard}
        />
        <MetricCard
          title="Total Funds"
          value={formatUsd(totalFunds)}
          subtext="Wallet + topup + referral + payout"
          icon={TrendingUp}
          tone="accent"
        />
      </section>

      <MetaSpendingSummaryCardsPanel dataState={spendingOverview} />

      <section className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="dashboard-subpanel rounded-[32px] border border-white/10 p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight dashboard-text-strong">Approved Topup Timeline</h2>
              <p className="mt-1 text-sm dashboard-text-muted">Seven latest approved payment days, visualized as a smooth area trend.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)] px-3 py-2">
              <CalendarDays size={15} className="dashboard-text-muted" />
              <span className="text-xs font-bold dashboard-text-muted">Last 7 days</span>
            </div>
          </div>

          {topupHistory.length > 0 ? (
            <div
              className="rounded-[28px] border border-[var(--dashboard-frame-border)] p-4 sm:p-5"
              style={{ background: `linear-gradient(180deg, ${TOPUP_CHART_TINT}, ${TOPUP_CHART_TINT_SOFT})` }}
            >
              <div className="h-[280px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={topupHistory}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 16,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient id="topupAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TOPUP_CHART_COLOR} stopOpacity={0.38} />
                        <stop offset="95%" stopColor={TOPUP_CHART_COLOR} stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.16)" strokeDasharray="4 8" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip
                      cursor={false}
                      formatter={(value) => [formatUsd(Number(value || 0)), "Approved topup"]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{
                        borderRadius: "18px",
                        border: "1px solid rgba(148,163,184,0.22)",
                        boxShadow: "0 18px 50px rgba(15,23,42,0.12)",
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                      }}
                    />
                    <Area
                      dataKey="total"
                      type="natural"
                      fill="url(#topupAreaFill)"
                      stroke={TOPUP_CHART_COLOR}
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex w-full items-start gap-2 border-t border-[var(--dashboard-frame-border)] pt-4 text-sm">
                <div className="grid gap-2">
                  <div
                    className={`flex items-center gap-2 leading-none font-medium ${isTrendPositive ? "" : "text-amber-300"}`}
                    style={isTrendPositive ? { color: TOPUP_CHART_COLOR } : undefined}
                  >
                    {isTrendPositive ? "Trending up" : "Trending down"} by {Math.abs(trendPercent).toFixed(1)}%
                    <TrendingUp className={`h-4 w-4 ${isTrendPositive ? "" : "rotate-180"}`} />
                  </div>
                  <div className="flex items-center gap-2 leading-none dashboard-text-muted">
                    {topupPeriodLabel}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyChartState
              title="No approved topups yet"
              message="Once a payment is approved, the timeline will populate here with the latest funding pattern."
            />
          )}
        </div>

        <div className="dashboard-subpanel rounded-[32px] border border-white/10 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-black tracking-tight dashboard-text-strong">Fund Distribution</h2>
            <p className="mt-1 text-sm dashboard-text-muted">How your money is currently split across key sources.</p>
          </div>

          {pieData.length > 0 ? (
            <>
              <div className="mx-auto h-[240px] max-w-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={96}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={FUND_COLORS[index % FUND_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatUsd(Number(value || 0)), name]}
                      contentStyle={{
                        borderRadius: "18px",
                        border: "1px solid rgba(148,163,184,0.22)",
                        boxShadow: "0 18px 50px rgba(15,23,42,0.12)",
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-3">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: FUND_COLORS[index % FUND_COLORS.length] }} />
                      <span className="text-sm font-semibold dashboard-text-strong">{item.name}</span>
                    </div>
                    <span className="text-sm font-black dashboard-text-strong">{formatUsd(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChartState
              title="Nothing to visualize yet"
              message="Add wallet funds or approved topups to unlock this distribution chart."
            />
          )}
        </div>
      </section>

      <MetaSpendingOverviewPanel className="p-0" dataState={spendingOverview} showSummaryCards={false} />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="dashboard-subpanel rounded-[32px] border border-white/10 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                <Users size={12} />
                Quick Links
              </div>
              <h2 className="text-xl font-black tracking-tight dashboard-text-strong">Most-used actions</h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="dashboard-subpanel flex items-center justify-between rounded-[24px] border border-[var(--dashboard-frame-border)] px-4 py-4 transition hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <span className="dashboard-accent-surface flex h-11 w-11 items-center justify-center rounded-2xl text-white">
                    <item.icon size={18} />
                  </span>
                  <span className="text-sm font-bold dashboard-text-strong">{item.label}</span>
                </div>
                <ArrowUpRight size={16} className="dashboard-text-faint" />
              </Link>
            ))}
          </div>
        </div>

        <div className="dashboard-subpanel rounded-[32px] border border-white/10 p-5 sm:p-6">
          <div className="mb-5">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              <ShieldCheck size={12} />
              Account Snapshot
            </div>
            <h2 className="text-xl font-black tracking-tight dashboard-text-strong">Profile health</h2>
            <p className="mt-1 text-sm dashboard-text-muted">A concise status board for your account identity.</p>
          </div>

          <div className="space-y-1">
            {accountHealth.map((item) => (
              <InfoRow key={item.label} label={item.label} value={item.value} />
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-[var(--dashboard-frame-border)] bg-[linear-gradient(180deg,rgba(34,197,94,0.12),rgba(255,255,255,0.02))] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">Status note</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {totalWallet > 0
                ? "Your wallet has active balance available for current operations."
                : "Your wallet is currently empty. A topup will unlock more actions and visibility."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
