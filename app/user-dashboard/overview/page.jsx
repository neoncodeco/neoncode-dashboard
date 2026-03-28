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
import CurrencyAmount from "@/components/CurrencyAmount";
import { formatUsd, resolveUsdToBdtRate } from "@/lib/currency";

const premiumSurface =
  "relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.97))] shadow-[0_12px_32px_-20px_rgba(15,23,42,0.25)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200/80 hover:shadow-[0_20px_48px_-24px_rgba(37,99,235,0.2)]";

const premiumInset =
  "absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent";

// Optimized StatCard
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  suffix = "$",
  children,
  usdToBdtRate,
  showCurrency = false,
}) => (
  <div className={`group min-h-[7.5rem] p-3.5 sm:p-4 ${premiumSurface}`}>
    <div className={premiumInset}></div>
    <div className="absolute -right-8 top-0 h-16 w-16 rounded-full bg-blue-100/40 blur-2xl transition-opacity group-hover:opacity-70"></div>
    <div className="mb-2 flex items-start justify-between gap-2">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${color} text-white shadow-md transition-transform duration-300 group-hover:scale-105`}
      >
        <Icon size={16} />
      </div>
      <div className="text-right">
        <p className="text-[7px] font-black uppercase tracking-[0.18em] text-slate-400 sm:text-[8px] lg:text-[9px]">{title}</p>
        {showCurrency ? (
          <CurrencyAmount
            value={value}
            usdToBdtRate={usdToBdtRate}
            primaryClassName="mt-0.5 text-lg font-black leading-none text-slate-900 sm:text-xl lg:text-[1.45rem]"
            secondaryClassName="mt-0.5 text-[8.5px] font-semibold text-slate-500 sm:text-[9px]"
          />
        ) : (
          <h3 className="mt-0.5 text-lg font-black leading-none text-slate-900 sm:text-xl lg:text-[1.45rem]">
            {value?.toLocaleString()} <span className="text-[10px] font-semibold text-slate-500">{suffix}</span>
          </h3>
        )}
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
          headers: { Authorization: `Bearer ${token}` },
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
          .map(([name, value]) => ({ name, value, color: "#8b5cf6" }));
        setTopupHistory(historyData);
      } catch (error) {
        console.error("Failed to load topup history:", error);
      }
    };
    void loadTopupHistory();
    return () => { active = false; };
  }, [token]);

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = userData.referralStats || {};
  const usdToBdtRate = resolveUsdToBdtRate(userData?.currencyConfig?.usdToBdtRate);
  const appBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.neoncode.co";
  const referralLink = `${appBaseUrl}/ref/${userData?.referralCode || ""}`;
  const recentTopups = topupHistory.slice(0, 2); // Mobile space bachanur jonno 2-ta nilam
  const chartData = [
    { name: "Wallet", value: userData.walletBalance || 0, color: "#3b82f6" },
    { name: "Income", value: stats.totalReferIncome || 0, color: "#10b981" },
    { name: "Payout", value: stats.totalPayout || 0, color: "#f43f5e" },
    { name: "Topup", value: userData.topupBalance || 0, color: "#8b5cf6" },
  ];

  const totalFlow = (stats.totalReferIncome || 0) + (stats.totalPayout || 0);
  const marginPercentage = totalFlow > 0 ? ((stats.totalReferIncome / totalFlow) * 100).toFixed(1) : 0;

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedReferral(true);
      window.setTimeout(() => setCopiedReferral(false), 2200);
    } catch (error) { console.error("Failed to copy referral link:", error); }
  };

  return (
    <div className="min-h-screen w-full bg-transparent p-4 md:pt-5 md:p-8">
      {/* Header section remains similar but compact */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-[1.3rem] font-black tracking-tight text-slate-900 sm:text-[1.8rem]">Overview</h1>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500 sm:text-sm">Monitoring your performance and wallet activities.</p>
        </div>
        <div className={`flex items-center justify-between gap-2 rounded-[1.1rem] p-1.5 backdrop-blur ${premiumSurface}`}>
          <span className="px-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 sm:px-3 sm:text-xs">ID: {userData.userId?.slice(-6)}</span>
          <Link
            href="/user-dashboard/payment-methods"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-bold text-white shadow-md hover:bg-blue-700 sm:px-4 sm:py-2.5 sm:text-[12px]"
          >
            <Zap size={14} /> Topup
          </Link>
        </div>
      </div>

      {/* Optimized Grid: grid-cols-2 for mobile, grid-cols-3 for small tablets, xl:grid-cols-5 for desktop */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          title="Wallet Balance"
          value={userData.walletBalance}
          usdToBdtRate={usdToBdtRate}
          showCurrency
          icon={Wallet}
          color="bg-blue-600"
        />
        <StatCard
          title="Topup Balance"
          value={userData.topupBalance}
          usdToBdtRate={usdToBdtRate}
          showCurrency
          icon={CreditCard}
          color="bg-indigo-600"
        >
          {/* Recent Topup ektu compact kora hoyeche mobile height bachanur jonno */}
          <div className="mt-2 border-t border-slate-200/60 pt-2 hidden sm:block">
             <p className="text-[7px] font-black uppercase tracking-[0.15em] text-slate-400">Recent</p>
             {recentTopups.map((item) => (
                <div key={item.name} className="mt-1 flex items-center justify-between text-[9px] font-bold text-slate-600">
                  <span>{item.name}</span>
                  <span className="text-indigo-600">{formatUsd(item.value)}</span>
                </div>
             ))}
          </div>
        </StatCard>
        {/* <StatCard title="Total Referrers" value={stats.totalReferrers} icon={Users} color="bg-orange-500" suffix="Users" /> */}
        {/* <StatCard title="Refer Income" value={stats.totalReferIncome} usdToBdtRate={usdToBdtRate} showCurrency icon={TrendingUp} color="bg-emerald-600" /> */}
        <StatCard title="Total Payout" value={stats.totalPayout} usdToBdtRate={usdToBdtRate} showCurrency icon={DollarSign} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Activity Analytics and Payout Methods */}
        <div className="space-y-6 xl:col-span-8">
          <div className={`p-4 backdrop-blur sm:p-6 ${premiumSurface}`}>
            <div className={premiumInset}></div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 sm:text-base">
                <ArrowRightLeft className="text-blue-600" size={18} /> Activity Analytics
              </h2>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Income
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> Payout
                </span>
              </div>
            </div>
            <div className="h-[280px] w-full sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "15px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className={`p-5 sm:p-6 ${premiumSurface}`}>
              <div className={premiumInset}></div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-900">
                <Banknote className="text-blue-600" size={18} /> Payout Methods
              </h3>
              <div className="space-y-2.5">
                {[ { label: "bKash Payout", tag: "ACTIVE", color: "bg-pink-100 text-pink-600", tagColor: "bg-green-100 text-green-600", initial: "bK" },
                   { label: "Nagad Payout", tag: "SETUP NEEDED", color: "bg-orange-100 text-orange-600", tagColor: "bg-gray-100 text-gray-400", initial: "Ng" }
                ].map((method) => (
                  <div key={method.label} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-bold ${method.color}`}>{method.initial}</div>
                      <span className="text-xs font-bold text-slate-700">{method.label}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${method.tagColor}`}>{method.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`flex flex-col justify-center p-5 sm:p-6 ${premiumSurface}`}>
              <div className={premiumInset}></div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-sm font-black text-slate-900">Identity Verified</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">Securely monitored by Neon Code Guard.</p>
              <button className="mt-3 flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:gap-2 transition-all">
                Settings <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Referral Card & Status */}
        <div className="space-y-6 xl:col-span-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-400/10 bg-[#07111f] p-6 text-white shadow-xl">
             {/* Referral content simplified for smaller look */}
             <div className="relative z-10">
                <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-200/90 border border-white/5">
                  <Share2 size={10} /> Referral
                </p>
                <h2 className="text-[1.5rem] font-black leading-tight tracking-tight sm:text-[1.8rem]">Earn with invites</h2>
                
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-3.5">
                    <p className="text-[8px] font-bold uppercase text-slate-400">Total Refer</p>
                    <p className="mt-1 text-2xl font-black text-white">{stats.totalReferrers || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-3.5">
                    <p className="text-[8px] font-bold uppercase text-slate-400">Earnings</p>
                    <p className="mt-1 text-xl font-black text-white leading-none">${stats.totalReferIncome || 0}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                   <p className="text-[9px] font-bold text-slate-400 truncate">{referralLink}</p>
                   <div className="mt-3 flex gap-2">
                     <button onClick={copyReferralLink} className="flex-1 rounded-xl bg-emerald-500 py-2 text-[11px] font-black text-slate-950 transition hover:bg-emerald-400">
                        {copiedReferral ? "Copied!" : "Copy Link"}
                     </button>
                   </div>
                </div>
             </div>
             <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl"></div>
          </div>

          <div className={`p-5 ${premiumSurface}`}>
            <div className={premiumInset}></div>
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-bold text-gray-900">
              <Clock size={16} className="text-orange-500" /> Account Status
            </h3>
            <div className="space-y-4">
               {[ { label: "Last Updated", val: new Date(userData.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), color: "bg-emerald-500" },
                  { label: "Member Since", val: new Date(userData.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "short" }), color: "bg-blue-500" }
               ].map((item)=>(
                <div key={item.label} className="flex gap-3">
                  <div className={`h-8 w-1 shrink-0 rounded-full ${item.color}`}></div>
                  <div>
                    <p className="text-[8px] font-bold uppercase text-gray-400">{item.label}</p>
                    <p className="text-[12px] font-bold text-gray-700">{item.val}</p>
                  </div>
                </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
