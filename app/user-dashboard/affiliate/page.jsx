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
  Info,
  ShieldCheck,
  Zap
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
  "overflow-hidden rounded-[1.9rem] border border-gray-100 bg-white p-6 shadow-[0_18px_46px_-30px_rgba(15,23,42,0.28)] backdrop-blur sm:p-8 dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_22px_54px_-34px_rgba(2,6,23,0.7)]";

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
    <div className="mx-auto min-h-screen space-y-10 bg-transparent p-4 lg:p-10">
      
      {/* ================= HEADER ================= */}
      <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.14)] md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-stretch xl:justify-between">
          <div className="max-w-3xl xl:flex xl:flex-col xl:justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-lime-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-lime-300">
              <ShieldCheck size={14} />
              Trusted Affiliate Program
            </span>
            <h1 className="mt-5 max-w-2xl text-[2.4rem] font-black leading-[0.96] tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Affiliate Command{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-blue-500 to-sky-400 bg-clip-text text-transparent">Center</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
              Track real referral earnings, measure conversion progress, and turn every qualified top-up into predictable commission growth.
            </p>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-3 xl:w-[600px]">
            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_16px_34px_-24px_rgba(2,6,23,0.7)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Available Now</p>
              <p className="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-white">${availableToWithdraw}</p>
              <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">Ready for withdrawal</p>
            </div>
            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_16px_34px_-24px_rgba(2,6,23,0.7)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Qualified Referrals</p>
              <p className="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-white">{completedUsers}</p>
              <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">Completed top-up threshold</p>
            </div>
            <button
              onClick={() => setWithdrawOpen(true)}
              className="group flex min-h-[156px] flex-col items-start justify-between rounded-[1.8rem] border border-slate-200 bg-slate-900 px-6 py-5 text-left text-white shadow-[0_20px_44px_-26px_rgba(15,23,42,0.42)] transition hover:-translate-y-1 hover:bg-indigo-600 dark:border-slate-700"
            >
              <span className="inline-flex rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                Cash Out
              </span>
              <div>
                <p className="text-xl font-black">Withdraw Funds</p>
                <p className="mt-1 text-sm text-white/70">Move your commission to payout safely.</p>
              </div>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
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
              <h3 className="flex items-center gap-2 text-xl font-black text-gray-800 dark:text-slate-100">
                <Zap size={20} className="fill-yellow-500 text-yellow-500"/> Share Your Link
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Copy once, then push it through high-intent channels like WhatsApp or Facebook communities.</p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
              Code: {userData?.referralCode || "Loading"}
            </span>
          </div>

          <div className="flex flex-col xl:flex-row gap-3">
            <div className="flex flex-1 rounded-2xl border border-gray-200 bg-gray-50 p-2 shadow-inner dark:border-slate-800 dark:bg-slate-900">
              <input
                value={referralLink}
                readOnly
                className="flex-1 truncate bg-transparent px-4 text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
              <button
                onClick={copyLink}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                  copied ? "bg-green-500 text-white" : "bg-gray-900 text-white hover:bg-indigo-600"
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            
            <div className="flex gap-2">
               <button onClick={() => shareOnSocial('whatsapp')} className="rounded-xl bg-green-100 px-4 py-3 text-green-700 transition-colors hover:bg-green-200 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/20">
                  <span className="text-xs font-black uppercase tracking-wide">WhatsApp</span>
               </button>
               <button onClick={() => shareOnSocial('facebook')} className="rounded-xl bg-blue-100 px-4 py-3 text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20">
                  <span className="text-xs font-black uppercase tracking-wide">Facebook</span>
               </button>
            </div>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-[1.9rem] bg-[linear-gradient(135deg,#365ef7_0%,#4f46e5_55%,#7c3aed_100%)] p-6 text-white shadow-[0_24px_60px_-30px_rgba(79,70,229,0.55)] sm:p-8">
          <div className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <h4 className="flex items-center gap-2 text-xl font-black">
            <Info size={20} /> Pro Tip
          </h4>
          <p className="text-indigo-100 mt-4 leading-relaxed">
            Invite serious buyers, agencies, and repeat spenders. Once a referral tops up <b>${MIN_TOPUP_FOR_COMMISSION}</b>, you earn an instant <b>$10</b> and move closer to higher milestone rewards.
          </p>
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/70">Next Target</p>
            <p className="mt-2 text-2xl font-black">{nextMilestone ? `${nextMilestone.count} referrals` : "All milestones cleared"}</p>
            <p className="mt-1 text-sm text-indigo-100">{nextMilestone ? `${nextMilestoneRemaining} more qualified referrals to unlock $${nextMilestone.reward}` : "You already unlocked every listed milestone."}</p>
          </div>
        </div>
      </div>

      {/* ================= NEW: HOW IT WORKS SECTION ================= */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.14)] sm:p-8 dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_24px_60px_-34px_rgba(2,6,23,0.72)]">
         <div className="relative mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
           <div>
             <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">How It Works</h2>
             <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">A realistic referral cycle from invite to qualified deposit and payout, laid out like a proper growth funnel.</p>
           </div>
           <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 shadow-sm dark:border-slate-700 dark:bg-[#111c34] dark:text-slate-300">
             Performance Flow
           </span>
         </div>
         <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="group rounded-[1.7rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:shadow-[0_24px_52px_-28px_rgba(56,189,248,0.2)] dark:border-[#22365d] dark:bg-[linear-gradient(180deg,#13213b_0%,#0d172b_100%)] dark:shadow-[0_18px_40px_-28px_rgba(2,6,23,0.8)]">
               <div className="flex items-center justify-between">
                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300 text-xl font-black text-[#0b1325] shadow-lg shadow-lime-200/60 dark:bg-lime-400 dark:shadow-lime-900/20">1</div>
                 <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Outreach</span>
               </div>
               <h4 className="mt-5 text-xl font-black text-slate-900 dark:text-white">Invite Strategic Buyers</h4>
               <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">Share your link with agency owners, freelancers, ecommerce operators, and media buyers who actually recharge ad budgets regularly.</p>
            </div>
            <div className="group rounded-[1.7rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:shadow-[0_24px_52px_-28px_rgba(59,130,246,0.2)] dark:border-[#22365d] dark:bg-[linear-gradient(180deg,#13213b_0%,#0d172b_100%)] dark:shadow-[0_18px_40px_-28px_rgba(2,6,23,0.8)]">
               <div className="flex items-center justify-between">
                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-xl font-black text-white shadow-lg shadow-sky-200/60 dark:shadow-sky-950/20">2</div>
                 <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Tracking</span>
               </div>
               <h4 className="mt-5 text-xl font-black text-slate-900 dark:text-white">Track Qualified Top-Ups</h4>
               <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">When their total top-up reaches ${MIN_TOPUP_FOR_COMMISSION}, the system marks them as qualified and unlocks your instant commission.</p>
            </div>
            <div className="group rounded-[1.7rem] border border-slate-200 bg-white/95 p-6 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 hover:shadow-[0_24px_52px_-28px_rgba(16,185,129,0.22)] dark:border-[#22365d] dark:bg-[linear-gradient(180deg,#13213b_0%,#0d172b_100%)] dark:shadow-[0_18px_40px_-28px_rgba(2,6,23,0.8)]">
               <div className="flex items-center justify-between">
                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-black text-white shadow-lg shadow-emerald-200/60 dark:shadow-emerald-950/20">3</div>
                 <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Growth</span>
               </div>
               <h4 className="mt-5 text-xl font-black text-slate-900 dark:text-white">Scale Through Milestones</h4>
               <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">As more referrals qualify, your earnings stack with milestone bonuses so the page feels like a real performance dashboard, not a plain counter.</p>
            </div>
         </div>
      </div>

      {/* ================= MILESTONES PROGRESS ================= */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-slate-100">Milestones Progress</h2>
            <span className="rounded-full bg-yellow-100 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300">Cash Rewards</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {LEVEL1_MILESTONES.map((m, i) => {
            const progress = Math.min((completedUsers / m.count) * 100, 100).toFixed(0);
            const completed = completedUsers >= m.count;

            return (
              <div key={i} className={`rounded-[1.9rem] border p-6 transition-all sm:p-8 ${completed ? "border-green-400 bg-green-50/70 shadow-[0_18px_40px_-28px_rgba(34,197,94,0.28)] dark:border-green-500/70 dark:bg-green-500/10 dark:shadow-[0_20px_44px_-32px_rgba(34,197,94,0.35)]" : "border-slate-200 bg-white shadow-[0_18px_46px_-30px_rgba(15,23,42,0.18)] hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_22px_54px_-30px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-950 dark:shadow-[0_22px_54px_-36px_rgba(2,6,23,0.72)]"}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className={`p-3 rounded-2xl ${completed ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-400"}`}>
                    <Gift size={24} />
                  </div>
                  <span className={`text-lg font-black ${completed ? "text-green-600 dark:text-green-300" : "text-gray-400 dark:text-slate-400"}`}>${m.reward}</span>
                </div>
                <h3 className="text-xl font-black text-gray-800 dark:text-slate-100">{m.count} Referrals</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                  {completed ? "Milestone unlocked successfully." : `${Math.max(m.count - completedUsers, 0)} more qualified referrals needed.`}
                </p>
                <div className="mt-6 space-y-2">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                    <div className={`h-full transition-all duration-1000 ${completed ? "bg-green-500" : "bg-indigo-600"}`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
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
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300",
    pink: "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-300",
  };

  return (
    <div className="group rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_22px_52px_-28px_rgba(79,70,229,0.18)] sm:p-8 dark:border-slate-700 dark:bg-slate-950 dark:shadow-[0_22px_52px_-34px_rgba(2,6,23,0.7)]">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">{label}</p>
          <h3 className="text-4xl font-black text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-300">{value}</h3>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{sub}</p>
        </div>
        <div className={`p-4 rounded-2xl ${gradients[color]}`}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  );
};
