"use client";
import React, { useEffect, useState } from "react";
import {
  Users, DollarSign, Activity, Layers, ClipboardList,
  Share2, Ticket, TrendingUp, Download, Filter, Wallet,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useAdminDashboardCache } from "@/hooks/useAdminDashboardCache";
import useAppAuth from "@/hooks/useAppAuth";
import { AFFILIATE_UI_ENABLED } from "@/lib/featureFlags";
import Link from "next/link";
import AvailableBalanceBreakdownModal from "@/components/admin/AvailableBalanceBreakdownModal";

const METRICS = (data) => [
  { label: "Total Deposits", val: data?.metrics?.totalRevenue, suffix: "Tk", icon: DollarSign, accent: "#10b981" },
  ...(AFFILIATE_UI_ENABLED
    ? [{ label: "Total Withdraw", val: data?.metrics?.totalWithdraw, suffix: "$", icon: Share2, accent: "#ef4444" }]
    : []),
  { label: "Monthly Budget", val: data?.metrics?.totalBudget, suffix: "$", icon: Layers, accent: "#3b82f6" },
  { label: "Limit Changes", val: data?.metrics?.totalLimitChange, suffix: "$", icon: ClipboardList, accent: "#f59e0b" },
  {
    label: "Available Balance",
    val: data?.metrics?.totalAvailableBalance,
    suffix: "$",
    icon: Wallet,
    accent: "#8b5cf6",
    hint: data?.metrics?.liveAdAccountCount
      ? `${data.metrics.liveAdAccountCount} live ad account${data.metrics.liveAdAccountCount === 1 ? "" : "s"} · Click for details`
      : "Click for details",
    clickable: true,
    action: "available-balance",
  },
];

const COUNTS = [
  { label: "Users",       key: "users",             icon: Users    },
  { label: "Tickets",     key: "tickets",            icon: Ticket   },
  { label: "Ad Requests", key: "adAccountRequests",  icon: Layers   },
  { label: "Spend Logs",  key: "spendingLogs",       icon: Activity },
];

function SkeletonMetric() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="admin-skeleton mb-3 h-4 w-20 rounded-full" />
      <div className="admin-skeleton mb-1 h-3 w-24 rounded-full" />
      <div className="admin-skeleton h-7 w-28 rounded-lg" />
    </div>
  );
}

export default function AdminDashboard() {
  const { token } = useAppAuth();
  const { getCache, setCache } = useAdminDashboardCache();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState("all");
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceDetails, setBalanceDetails] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  useEffect(() => {
    if (!token) return;
    const cacheKey = `admin-overview:v2:${range}`;
    const cached   = getCache(cacheKey);
    if (cached) { setData(cached); setLoading(false); return; }

    setLoading(true);
    fetch(`/api/admin/stats?range=${range}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((result) => { if (result.ok) { setData(result.data); setCache(cacheKey, result.data); } })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [getCache, range, setCache, token]);

  const handleDownload = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Deposits (BDT)", data.metrics.totalRevenue],
      ["Total Withdraw",       data.metrics.totalWithdraw],
      ["Total Budget", data.metrics.totalBudget],
      ["Limit Changes", data.metrics.totalLimitChange],
      ["Available Balance (USD)", data.metrics.totalAvailableBalance],
      ["User Count",           data.counts.users],
      ["Range",                range],
      ["Generated",            new Date().toLocaleString()],
    ];
    const a     = document.createElement("a");
    a.href      = encodeURI("data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n"));
    a.download  = `report_${range}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const metrics = METRICS(data);
  const metricGridClass = AFFILIATE_UI_ENABLED ? "xl:grid-cols-5" : "xl:grid-cols-4";

  const openBalanceBreakdown = async () => {
    if (!token) return;
    setBalanceModalOpen(true);
    setBalanceLoading(true);
    setBalanceError("");
    try {
      const res = await fetch("/api/admin/stats/ad-account-balances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Could not load ad account balances.");
      setBalanceDetails(json);
    } catch (err) {
      setBalanceError(err.message || "Could not load ad account balances.");
      setBalanceDetails(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <AvailableBalanceBreakdownModal
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        data={balanceDetails}
        loading={balanceLoading}
        error={balanceError}
      />

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Overview</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Showing stats for{" "}
            <span className="font-bold capitalize text-gray-700">{range === "all" ? "all time" : range}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5">
            <Filter size={14} className="shrink-0 text-gray-400" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="cursor-pointer bg-transparent text-sm font-bold text-gray-700 outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <button
            onClick={handleDownload}
            className="admin-accent-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className={`grid grid-cols-2 gap-3 ${metricGridClass} xl:gap-4`}>
        {loading && !data
          ? Array.from({ length: metricGridClass.includes("5") ? 5 : 4 }).map((_, i) => <SkeletonMetric key={i} />)
          : metrics.map((item, i) => {
              const CardTag = item.clickable ? "button" : "div";
              return (
              <CardTag
                key={i}
                type={item.clickable ? "button" : undefined}
                onClick={item.action === "available-balance" ? openBalanceBreakdown : undefined}
                className={`rounded-2xl border border-gray-200 bg-white p-5 text-left transition-transform hover:-translate-y-0.5 ${
                  item.clickable ? "cursor-pointer hover:border-violet-200 hover:shadow-md" : ""
                }`}
                style={{ borderLeft: `3px solid ${item.accent}` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="rounded-xl p-2" style={{ background: `${item.accent}18` }}>
                    <item.icon size={16} style={{ color: item.accent }} />
                  </div>
                  <span className="admin-badge flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                    <TrendingUp size={8} /> Live
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-black text-gray-900">
                  {Number(item.val || 0).toLocaleString(undefined, {
                    minimumFractionDigits: item.suffix === "$" ? 2 : 0,
                    maximumFractionDigits: item.suffix === "$" ? 2 : 0,
                  })}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {item.hint || `${item.suffix} total`}
                </p>
              </CardTag>
            );
            })}
      </div>

      {/* ── Count cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {COUNTS.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:-translate-y-0.5"
          >
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
              <item.icon size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{item.label}</p>
              <p className="mt-0.5 text-xl font-black text-gray-900">
                {loading && !data ? "—" : (data?.counts?.[item.key] ?? 0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-black tracking-tight text-gray-900">Registration Analytics</h3>
            <p className="mt-0.5 text-xs text-gray-500">Monthly user growth and registration activity</p>
          </div>
          <span className="admin-badge w-fit rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest">
            Annual View
          </span>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.9} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                  backgroundColor: "#ffffff",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#0ea5e9"
                fill="url(#colorValue)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Registrations ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-black tracking-tight text-gray-900">Recent Registrations</h3>
            <p className="mt-0.5 text-[11px] text-gray-400">Last 10 users to sign up</p>
          </div>
          <Link
            href="/admin-dashboard/users"
            className="text-xs font-bold text-sky-600 transition hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                <th className="px-5 py-3 bg-gray-50/60">User</th>
                <th className="px-5 py-3 bg-gray-50/60">Role</th>
                <th className="px-5 py-3 bg-gray-50/60">Wallet</th>
                <th className="px-5 py-3 bg-gray-50/60 text-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="admin-skeleton h-8 w-8 rounded-xl" />
                          <div className="space-y-1.5">
                            <div className="admin-skeleton h-3 w-24 rounded-full" />
                            <div className="admin-skeleton h-2.5 w-32 rounded-full" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><div className="admin-skeleton h-5 w-16 rounded-full" /></td>
                      <td className="px-5 py-3.5"><div className="admin-skeleton h-3 w-12 rounded-full" /></td>
                      <td className="px-5 py-3.5 text-right"><div className="admin-skeleton ml-auto h-3 w-20 rounded-full" /></td>
                    </tr>
                  ))
                : data?.recentUsers?.map((user, i) => (
                    <tr key={i} className="border-b border-gray-50 transition hover:bg-gray-50/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white"
                            style={{ background: `hsl(${(user.name?.charCodeAt(0) ?? 65) * 7 % 360}, 55%, 50%)` }}
                          >
                            {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-tight text-gray-900">{user.name || "Unknown"}</p>
                            <p className="text-[11px] text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="admin-badge rounded-full px-2.5 py-1 text-[10px] font-bold capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-black text-emerald-600">{user.walletBalance || 0} $</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-xs font-medium text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
