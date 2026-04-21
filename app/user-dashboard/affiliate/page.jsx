"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Users,
  Copy,
  Check,
  Gift,
  ArrowRight,
  Share2,
  ShieldCheck,
  Zap,
  MessageCircle,
  Facebook,
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import WithdrawModal from "@/components/WithdrawModal";

/* ================= CONFIG ================= */
const LEVEL1_MILESTONES = [
  { count: 10, reward: 50 },
  { count: 25, reward: 150 },
  { count: 50, reward: 400 },
];
const MIN_TOPUP_FOR_COMMISSION = 2000;
const panelClass =
  "dashboard-subpanel overflow-hidden rounded-[28px] border border-sky-300/35 bg-[linear-gradient(135deg,rgba(115,200,255,0.24),rgba(183,223,105,0.12)_52%,rgba(255,255,255,0.94))] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8";

export default function AffiliatePage() {
  const { userData } = useFirebaseAuth();
  const [copied, setCopied] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const totalReferIncome = userData?.referralStats?.totalReferIncome || 0;
  const totalPayout = userData?.referralStats?.totalPayout || 0;
  const totalReferrers = userData?.referralStats?.totalReferrers || 0;
  const completedUsers = userData?.level1DepositCount || 0;

  const appBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.neoncode.co";
  const referralLink = `${appBaseUrl}/ref/${userData?.referralCode || "loading..."}`;
  const availableToWithdraw = Math.max(totalReferIncome - totalPayout, 0);
  const nextMilestone = LEVEL1_MILESTONES.find((m) => completedUsers < m.count) || null;
  const nextMilestoneRemaining = nextMilestone ? Math.max(nextMilestone.count - completedUsers, 0) : 0;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform) => {
    const text = `Join Neon Code and scale your ads! Use my link: ${referralLink}`;
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    };
    window.open(urls[platform], "_blank");
  };

  return (
    <div className="user-dashboard-theme-scope mx-auto min-h-screen space-y-6 bg-transparent p-2.5 sm:space-y-8 sm:p-4 lg:p-6">
      
      {/* ================= HEADER ================= */}
      <div className="dashboard-subpanel mt-3 rounded-[28px] border border-emerald-300/35 bg-[linear-gradient(135deg,rgba(183,223,105,0.24),rgba(115,200,255,0.12)_52%,rgba(255,255,255,0.94))] p-4 sm:mt-4 sm:rounded-[32px] sm:p-6 md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-stretch xl:justify-between">
          <div className="max-w-3xl xl:flex xl:flex-col xl:justify-center">
            <span className="dashboard-chip inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]">
              <ShieldCheck size={14} />
              Trusted Affiliate Program
            </span>
            <h1 className="dashboard-text-strong mt-4 max-w-2xl text-[1.8rem] font-black leading-[1.02] tracking-tight sm:mt-5 sm:text-[2.2rem] lg:text-5xl">
              Affiliate Dashboard
            </h1>
            <p className="dashboard-text-muted mt-4 max-w-2xl text-sm leading-7 sm:text-base">
              Monitor earnings, copy your referral link, and withdraw available commission.
            </p>
          </div>

          <div className="w-full space-y-3 sm:space-y-4 xl:w-[600px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="dashboard-subpanel rounded-[28px] border !border-emerald-300/60 !bg-[linear-gradient(135deg,rgba(183,223,105,0.52),rgba(183,223,105,0.24)_48%,rgba(255,255,255,0.94))] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <p className="dashboard-text-muted text-sm font-bold">Available Now</p>
                <p className="dashboard-text-strong mt-3 text-[1.55rem] font-black tracking-tight sm:text-[1.9rem]">${availableToWithdraw}</p>
                <p className="dashboard-text-muted mt-2 text-sm">Ready for withdrawal</p>
              </div>
              <div className="dashboard-subpanel rounded-[28px] border !border-sky-300/60 !bg-[linear-gradient(135deg,rgba(115,200,255,0.44),rgba(115,200,255,0.2)_50%,rgba(255,255,255,0.94))] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <p className="dashboard-text-muted text-sm font-bold">Qualified Referrals</p>
                <p className="dashboard-text-strong mt-3 text-[1.55rem] font-black tracking-tight sm:text-[1.9rem]">{completedUsers}</p>
                <p className="dashboard-text-muted mt-2 text-sm">Completed top-up threshold</p>
              </div>
            </div>

            <button
              onClick={() => setWithdrawOpen(true)}
              className="dashboard-accent-surface inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-sm font-black transition hover:-translate-y-0.5 sm:w-auto sm:self-start"
            >
              <span>Cash Out Available Balance</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= STATS CARD SECTION ================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StatCard label="Total Income" value={`$${totalReferIncome}`} sub="Commissions earned" icon={DollarSign} color="indigo" />
        <StatCard label="Bonus Claimed" value={`$${totalPayout}`} sub="Milestone rewards" icon={Gift} color="teal" />
        <StatCard label="Total Referrals" value={totalReferrers} sub="Network size" icon={Users} color="pink" />
      </div>

      {/* ================= REFERRAL LINK & SHARE ================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={`relative lg:col-span-2 ${panelClass}`}>
          <div className="absolute right-0 top-0 p-4 opacity-[0.06]">
             <Share2 size={120} />
          </div>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="dashboard-text-strong flex items-center gap-2 text-xl font-black">
                <Zap size={20} className="fill-yellow-500 text-yellow-500"/> Share Your Link
              </h3>
              <p className="dashboard-text-muted mt-2 text-sm">Copy your referral link and share it.</p>
            </div>
            <span className="dashboard-chip inline-flex w-fit px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]">
              Code: {userData?.referralCode || "Loading"}
            </span>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row">
              <div className="dashboard-subpanel flex flex-1 flex-col gap-2 rounded-2xl border p-2 sm:flex-row sm:items-center">
              <input
                value={referralLink}
                readOnly
                  className="dashboard-text-strong w-full flex-1 truncate bg-transparent px-3 py-1.5 text-sm font-semibold outline-none sm:px-4"
              />
              <button
                onClick={copyLink}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-bold transition-all sm:w-auto ${
                    copied ? "dashboard-accent-surface" : "dashboard-accent-surface"
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              <button onClick={() => shareOnSocial('whatsapp')} className="dashboard-subpanel rounded-xl px-3 py-3 transition-colors hover:opacity-90 sm:px-4">
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide">
                  <MessageCircle size={14} />
                  WhatsApp
                </span>
              </button>
              <button onClick={() => shareOnSocial('facebook')} className="dashboard-subpanel rounded-xl px-3 py-3 transition-colors hover:opacity-90 sm:px-4">
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide">
                  <Facebook size={14} />
                  Facebook
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-subpanel rounded-[28px] border !border-indigo-300/55 !bg-[linear-gradient(135deg,rgba(103,163,255,0.42),rgba(103,163,255,0.18)_52%,rgba(255,255,255,0.94))] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="dashboard-text-muted text-[11px] font-black uppercase tracking-[0.16em]">Next Target</p>
          <p className="dashboard-text-strong mt-2 text-2xl font-black">
            {nextMilestone ? `${nextMilestone.count} referrals` : "All milestones cleared"}
          </p>
          <p className="dashboard-text-muted mt-2 text-sm leading-6">
            {nextMilestone
              ? `${nextMilestoneRemaining} more qualified referrals to unlock $${nextMilestone.reward}. Each qualified referral requires a $${MIN_TOPUP_FOR_COMMISSION}+ top-up.`
              : "You already unlocked every listed milestone."}
          </p>
        </div>
      </div>

      {/* ================= MILESTONES PROGRESS ================= */}
      <div className="space-y-8">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="dashboard-text-strong text-xl font-black tracking-tight sm:text-2xl">Milestones Progress</h2>
            <span className="dashboard-chip px-4 py-1.5 text-xs font-black uppercase tracking-wider">Cash Rewards</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {LEVEL1_MILESTONES.map((m, i) => {
            const progress = Math.min((completedUsers / m.count) * 100, 100).toFixed(0);
            const completed = completedUsers >= m.count;

            return (
              <div key={i} className={`dashboard-subpanel rounded-[28px] border p-6 transition-all sm:p-8 ${completed ? "!border-emerald-300/60 !bg-[linear-gradient(135deg,rgba(183,223,105,0.46),rgba(183,223,105,0.2)_52%,rgba(255,255,255,0.94))]" : "!border-indigo-300/50 !bg-[linear-gradient(135deg,rgba(103,163,255,0.36),rgba(103,163,255,0.16)_52%,rgba(255,255,255,0.94))] hover:-translate-y-1"}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className={`p-3 rounded-2xl ${completed ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-400"}`}>
                    <Gift size={24} />
                  </div>
                  <span className={`text-lg font-black ${completed ? "text-green-600 dark:text-green-300" : "text-gray-400 dark:text-slate-400"}`}>${m.reward}</span>
                </div>
                <h3 className="dashboard-text-strong text-xl font-black">{m.count} Referrals</h3>
                <p className="dashboard-text-muted mt-2 text-sm">
                  {completed ? "Milestone unlocked successfully." : `${Math.max(m.count - completedUsers, 0)} more qualified referrals needed.`}
                </p>
                <div className="mt-6 space-y-2">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--dashboard-panel-soft)]">
                    <div className={`h-full transition-all duration-1000 ${completed ? "bg-green-500" : "bg-indigo-600"}`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="dashboard-text-faint flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span>{completedUsers} / {m.count}</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= WITHDRAW MODAL ================= */}
      {withdrawOpen && (
        <WithdrawModal
          balance={totalReferIncome}
          onClose={() => setWithdrawOpen(false)}
        />
      )}
    </div>
  );
}

const StatCard = ({ label, value, sub, icon: Icon, color }) => {
  const gradients = {
    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      card: "!border-indigo-300/55 !bg-[linear-gradient(135deg,rgba(103,163,255,0.42),rgba(103,163,255,0.18)_52%,rgba(255,255,255,0.94))]",
      hoverValue: "group-hover:text-indigo-600",
    },
    teal: {
      icon: "bg-emerald-50 text-emerald-600",
      card: "!border-emerald-300/60 !bg-[linear-gradient(135deg,rgba(183,223,105,0.52),rgba(183,223,105,0.24)_48%,rgba(255,255,255,0.94))]",
      hoverValue: "group-hover:text-emerald-600",
    },
    pink: {
      icon: "bg-rose-50 text-rose-600",
      card: "!border-rose-300/60 !bg-[linear-gradient(135deg,rgba(251,113,133,0.36),rgba(251,113,133,0.18)_52%,rgba(255,255,255,0.94))]",
      hoverValue: "group-hover:text-rose-600",
    },
  };

  const style = gradients[color] || gradients.indigo;

  return (
    <div className={`group dashboard-subpanel rounded-[28px] border p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 sm:p-8 ${style.card}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="dashboard-text-muted text-sm font-bold">{label}</p>
          <h3 className={`dashboard-text-strong text-[1.9rem] font-black transition-colors ${style.hoverValue}`}>{value}</h3>
          <p className="dashboard-text-muted text-sm">{sub}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.icon}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};
