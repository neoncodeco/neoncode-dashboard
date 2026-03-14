"use client";

import React from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  Users,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Zap,
  ArrowRightLeft,
  ShieldCheck,
  Clock,
  Banknote,
  HelpCircle,
  Copy,
  Check,
  Share2,
} from "lucide-react";
import Link from "next/link";

const StatCard = ({ title, value, icon: Icon, color, suffix = "$", children }) => (
  <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
    <div className="mb-4 flex items-start justify-between">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white shadow-lg transition-transform group-hover:scale-110`}
      >
        <Icon size={24} />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
        <h3 className="mt-1 text-2xl font-black text-gray-900">
          {value?.toLocaleString()} <span className="text-sm font-medium">{suffix}</span>
        </h3>
      </div>
    </div>
    {children}
  </div>
);

const OverviewPage = () => {
  const { userData, token } = useFirebaseAuth();
  const [copiedReferral, setCopiedReferral] = React.useState(false);
  const [topupHistory, setTopupHistory] = React.useState([]);

  React.useEffect(() => {
    if (!token) return;

    let active = true;

    const loadTopupHistory = async () => {
      try {
        const res = await fetch("/api/payment/payhistory", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const json = await res.json();
        if (!res.ok || !json?.ok || !active) return;

        const aggregated = (json.data || [])
          .filter((item) => item.status === "approved")
          .reduce((acc, item) => {
            const label = new Date(item.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            });

            acc[label] = (acc[label] || 0) + Number(item.amount || 0);
            return acc;
          }, {});

        const historyData = Object.entries(aggregated)
          .slice(0, 7)
          .map(([name, value]) => ({
            name,
            value,
            color: "#8b5cf6",
          }));

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
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = userData.referralStats || {};
  const referralLink = `https://neoncode.com/ref/${userData?.referralCode || ""}`;
  const recentTopups = topupHistory.slice(0, 3);
  const chartData = [
    { name: "Wallet", value: userData.walletBalance || 0, color: "#3b82f6" },
    { name: "Income", value: stats.totalReferIncome || 0, color: "#10b981" },
    { name: "Payout", value: stats.totalPayout || 0, color: "#f43f5e" },
    { name: "Topup", value: userData.topupBalance || 0, color: "#8b5cf6" },
  ];

  const totalFlow = (stats.totalReferIncome || 0) + (stats.totalPayout || 0);
  const marginPercentage =
    totalFlow > 0 ? ((stats.totalReferIncome / totalFlow) * 100).toFixed(1) : 0;

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedReferral(true);
      window.setTimeout(() => setCopiedReferral(false), 2200);
    } catch (error) {
      console.error("Failed to copy referral link:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white p-4 pt-20 md:p-8">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Overview</h1>
          <p className="font-medium text-gray-500">Monitoring your performance and wallet activities.</p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-1.5">
          <span className="px-4 text-sm font-bold text-gray-600">ID: {userData.userId?.slice(-6)}</span>
          <Link
            href="/user-dashboard/payment-methods"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
          >
            <Zap size={16} />
            Topup
          </Link>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Wallet Balance" value={userData.walletBalance} icon={Wallet} color="bg-blue-600" />
        <StatCard title="Topup Balance" value={userData.topupBalance} icon={CreditCard} color="bg-indigo-600">
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Recent approved topup</p>
            {recentTopups.length > 0 ? (
              recentTopups.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <span className="text-xs font-semibold text-gray-500">{item.name}</span>
                  <span className="text-xs font-black text-indigo-600">${item.value}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">No approved topup yet</p>
            )}
          </div>
        </StatCard>
        <StatCard title="Total Referrers" value={stats.totalReferrers} icon={Users} color="bg-orange-500" suffix="Users" />
        <StatCard title="Refer Income" value={stats.totalReferIncome} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title="Total Payout" value={stats.totalPayout} icon={DollarSign} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <div className="rounded-[2.5rem] bg-white p-8 shadow-sm">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-xl font-bold text-gray-900">
                <ArrowRightLeft className="text-blue-600" /> Activity Analytics
              </h2>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Income
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span> Payout
                </span>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "20px",
                      border: "none",
                      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="value" radius={[15, 15, 15, 15]} barSize={55}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-8">
              <h3 className="mb-6 flex items-center gap-2 font-bold text-gray-900">
                <Banknote className="text-blue-600" size={20} /> Payout Methods
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-center text-xs font-bold text-pink-600">
                      bK
                    </div>
                    <span className="text-sm font-bold text-gray-700">bKash Payout</span>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-600">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-center text-xs font-bold text-orange-600">
                      Ng
                    </div>
                    <span className="text-sm font-bold text-gray-700">Nagad Payout</span>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-400">SETUP NEEDED</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Identity Verified</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Your account is under secure monitoring. All transactions are encrypted and protected by Neon Code Guard.
              </p>
              <button className="mt-4 flex items-center gap-1 text-sm font-bold text-blue-600 transition-all hover:gap-2">
                Security Settings <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8 xl:col-span-4">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-400/15 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_35%),linear-gradient(180deg,#07111f_0%,#0b1730_45%,#09101d_100%)] p-8 text-white shadow-[0_30px_80px_rgba(3,7,18,0.45)]">
            <div className="relative z-10">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200/90">
                    <Share2 size={12} />
                    Referral conversion
                  </p>
                  <h2 className="text-2xl font-black tracking-tight">Turn invites into steady income</h2>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-300">
                    Share your personal referral link and bring more high-value users into your network.
                  </p>
                </div>

                <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-white/5 shadow-inner shadow-emerald-400/10">
                  <div className="text-center">
                    <div className="text-4xl font-black leading-none">{marginPercentage}%</div>
                    <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                      Success
                    </div>
                  </div>
                  <div className="absolute inset-[10px] rounded-full border border-dashed border-emerald-400/25"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Referrals</p>
                  <p className="mt-3 text-3xl font-black text-white">{stats.totalReferrers || 0}</p>
                  <p className="mt-1 text-xs text-slate-300">Users joined with your code</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Total earning</p>
                  <p className="mt-3 text-3xl font-black text-white">৳{stats.totalReferIncome || 0}</p>
                  <p className="mt-1 text-xs text-slate-300">Income generated from referrals</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-emerald-400/15 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200/70">Referral progress</p>
                    <p className="mt-2 text-sm text-slate-300">
                      More referrals mean more earning potential from your dashboard network.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                    Live
                  </span>
                </div>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 transition-all duration-1000"
                    style={{ width: `${marginPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.9rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Earn more income with your direct referral link
                </p>
                <div className="mt-3 rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-slate-200">
                  <span className="block truncate font-medium">{referralLink}</span>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={referralLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02]"
                  >
                    Refer Now
                    <ArrowUpRight size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={copyReferralLink}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    {copiedReferral ? <Check size={16} /> : <Copy size={16} />}
                    {copiedReferral ? "Copied" : "Copy link"}
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl"></div>
            <div className="absolute -bottom-10 left-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl"></div>
          </div>

          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 font-bold text-gray-900">
              <Clock size={18} className="text-orange-500" /> Account Status
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-12 w-2 shrink-0 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Last Updated</p>
                  <p className="text-sm font-bold text-gray-700">
                    {new Date(userData.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-12 w-2 shrink-0 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">Member Since</p>
                  <p className="text-sm font-bold text-gray-700">
                    {new Date(userData.createdAt).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-50 pt-6">
              <div className="flex cursor-pointer items-center gap-3 text-sm text-gray-500 transition-all hover:text-blue-600">
                <HelpCircle size={18} />
                <span className="font-medium">Need help with payouts?</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
