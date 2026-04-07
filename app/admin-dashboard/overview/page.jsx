"use client";
import React, { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  Activity,
  Layers,
  ClipboardList,
  Share2,
  Ticket,
  MoreHorizontal,
  TrendingUp,
  Download,
  Filter
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAdminDashboardCache } from "@/hooks/useAdminDashboardCache";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Link from "next/link";

export default function AdminDashboard() {
  const { token } = useFirebaseAuth();
  const { getCache, setCache } = useAdminDashboardCache();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("all"); // Default range

  useEffect(() => {
    if (!token) return;
    const cacheKey = `admin-overview:${range}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/stats?range=${range}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await res.json();
        if (result.ok) {
          setData(result.data);
          setCache(cacheKey, result.data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getCache, range, setCache, token]);

  // CSV Download Logic
  const handleDownload = () => {
    if (!data) return;
    const csvRows = [
      ["Metric", "Value"],
      ["Total Deposits (BDT)", data.metrics.totalRevenue],
      ["Total Withdraw", data.metrics.totalWithdraw],
      ["Total Budget", data.metrics.totalBudget],
      ["User Count", data.counts.users],
      ["Date Range", range],
      ["Report Generated", new Date().toLocaleString()]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${range}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const metricsConfig = [
    { label: "Total Deposits", val: data?.metrics?.totalRevenue, icon: DollarSign, color: "text-green-600", bg: "bg-green-50", suffix: "Tk" },
    { label: "Total Withdraw", val: data?.metrics?.totalWithdraw, icon: Share2, color: "text-red-600", bg: "bg-red-50", suffix: "$" },
    { label: "Monthly Budget", val: data?.metrics?.totalBudget, icon: Layers, color: "text-blue-600", bg: "bg-blue-50", suffix: "$" },
    { label: "Limit Changes", val: data?.metrics?.totalLimitChange, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50", suffix: "$" },
  ];

  const countsConfig = [
    { label: "Users", key: "users", icon: Users, color: "text-gray-600" },
    { label: "Tickets", key: "tickets", icon: Ticket, color: "text-gray-600" },
    { label: "Ad Requests", key: "adAccountRequests", icon: Layers, color: "text-gray-600" },
    { label: "Spend Logs", key: "spendingLogs", icon: Activity, color: "text-gray-600" },
  ];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#fcfcfc] p-4   sm:p-6 sm:pt-5  md:space-y-8 md:p-8 md:pt-8 md:pb-12">
      
      {/* --- ১. হেডার --- */}
      <div className="flex flex-col gap-4 pt-2 sm:pt-4 md:flex-row md:items-center md:justify-between md:pt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-500 text-sm">Real-time insights for <span className="text-black font-bold capitalize">{range}</span></p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select 
              value={range} 
              onChange={(e) => setRange(e.target.value)}
              className="w-full cursor-pointer bg-transparent text-sm font-bold outline-none"
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
            className="admin-accent-button flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition"
          >
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      {/* --- ২. ফিন্যান্সিয়াল মেট্রিক্স কার্ডস --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        {metricsConfig.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {item.val?.toLocaleString()} {item.suffix}
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                <item.icon size={20} />
              </div>
            </div>
            <div className="admin-badge mt-4 flex w-fit items-center gap-1 rounded px-2 py-1 text-xs font-bold">
              <TrendingUp size={12} /> Live Updates
            </div>
          </div>
        ))}
      </div>

      {/* --- ৩. কালেকশন কাউন্ট ছোট কার্ডস (Sub Cards) --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {countsConfig.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/25 dark:hover:border-sky-900 dark:hover:bg-slate-900">
            <div className="rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 p-2.5 text-sky-700 shadow-sm dark:from-slate-800 dark:to-slate-900 dark:text-sky-300">
              <item.icon size={18} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">{data?.counts[item.key] || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- ৪. রেভিনিউ/ইউজার চার্ট --- */}
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50/60 p-4 shadow-sm shadow-slate-200/60 sm:p-6 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-[#0d1d3b] dark:shadow-black/25">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">Registration Analytics</h3>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Live chart of user growth and registration activity.</p>
          </div>
          <div className="inline-flex w-fit rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-sky-300">Annual View</div>
        </div>
        <div className="h-80 w-full rounded-3xl border border-white/80 bg-white/70 p-3 shadow-inner shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950/60 dark:shadow-black/20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.38}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.65} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} />
              <Tooltip contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(15,23,42,0.08)", backgroundColor: "#ffffff", color: "#0f172a" }} />
              <Area type="monotone" dataKey="users" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- ৫. রিসেন্ট ইউজার টেবিল (১০ জন ইউজার) --- */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-black tracking-tight text-slate-900">Recent 10 Registrations</h3>
          <Link href="/admin-dashboard/users"className="text-sm font-bold text-sky-600 transition hover:text-sky-700 hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto px-1 py-1 sm:px-2">
          <table className="min-w-[640px] w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="rounded-2xl bg-gradient-to-r from-slate-50 to-sky-50/70 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                <th className="rounded-l-2xl px-5 py-4">User Details</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Wallet</th>
                <th className="rounded-r-2xl px-5 py-4 text-right">Registered</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentUsers.map((user, i) => (
                <tr key={i} className="transition">
                  <td className="rounded-l-2xl border-y border-l border-slate-100 bg-white px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.02)] transition hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 text-xs font-black uppercase text-sky-700 shadow-sm">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-tight text-slate-800">{user.name || "Unknown"}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-y border-slate-100 bg-white px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.02)] transition hover:bg-slate-50">
                    <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="border-y border-slate-100 bg-white px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.02)] transition hover:bg-slate-50">
                    <p className="text-sm font-black tracking-tight text-emerald-600">{user.walletBalance || 0} $</p>
                  </td>
                  <td className="rounded-r-2xl border-y border-r border-slate-100 bg-white px-5 py-4 text-right shadow-[0_1px_0_rgba(15,23,42,0.02)] transition hover:bg-slate-50">
                    <p className="text-xs font-semibold text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</p>
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
