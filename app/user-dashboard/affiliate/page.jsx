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

export default function AffiliatePage() {
  const { userData } = useFirebaseAuth();
  const [copied, setCopied] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const totalReferIncome = userData?.referralStats?.totalReferIncome || 0;
  const totalPayout = userData?.referralStats?.totalPayout || 0;
  const totalReferrers = userData?.referralStats?.totalReferrers || 0;
  const completedUsers = userData?.level1DepositCount || 0;

  const referralLink = `https://neonstudio.com/ref/${userData?.referralCode || "loading..."}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform) => {
    const text = `Join Neon Studio and scale your ads! Use my link: ${referralLink}`;
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    };
    window.open(urls[platform], "_blank");
  };

  return (
    <div className="p-4 lg:p-10 space-y-12 mx-auto min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_40%),linear-gradient(180deg,#081227_0%,#0f2040_100%)]">
      
      {/* ================= HEADER ================= */}
      <div className="pt-16 md:pt-0 flex flex-col md:flex-row justify-between items-start gap-5 border-b pb-6 border-gray-200">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Partnership <span className="text-indigo-600">Dashboard</span>
          </h1>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-500" />
            Earn <b className="text-gray-900">$10</b> per qualifying referral + Milestone bonuses.
          </p>
        </div>

        <button
          onClick={() => setWithdrawOpen(true)}
          className="group flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-600 transition-all duration-300"
        >
          Withdraw Funds <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* ================= STATS CARD SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard label="Total Income" value={`$${totalReferIncome}`} sub="Commissions earned" icon={DollarSign} color="indigo" />
        <StatCard label="Bonus Claimed" value={`$${totalPayout}`} sub="Milestone rewards" icon={Gift} color="teal" />
        <StatCard label="Total Referrals" value={totalReferrers} sub="Network size" icon={Users} color="pink" />
      </div>

      {/* ================= REFERRAL LINK & SHARE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Share2 size={120} />
          </div>
          <h3 className="font-bold mb-4 text-xl flex items-center gap-2 text-gray-800">
            <Zap size={20} className="text-yellow-500 fill-yellow-500"/> Share Your Link
          </h3>

          <div className="flex flex-col xl:flex-row gap-3">
            <div className="flex-1 flex bg-gray-50 rounded-2xl p-2 border border-gray-200">
              <input
                value={referralLink}
                readOnly
                className="bg-transparent flex-1 px-4 text-sm font-medium outline-none truncate text-gray-600"
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
               <button onClick={() => shareOnSocial('whatsapp')} className="p-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors">
                  <span className="text-xs font-bold px-2">WhatsApp</span>
               </button>
               <button onClick={() => shareOnSocial('facebook')} className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors">
                  <span className="text-xs font-bold px-2">Facebook</span>
               </button>
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-lg shadow-indigo-200">
          <h4 className="font-bold text-xl flex items-center gap-2">
            <Info size={20} /> Pro Tip
          </h4>
          <p className="text-indigo-100 mt-4 leading-relaxed">
            Invite big spenders! Once they top up <b>$2,000</b>, you get an instant <b>$10</b> and move towards the <b>$400</b> mega bonus.
          </p>
        </div>
      </div>

      {/* ================= NEW: HOW IT WORKS SECTION ================= */}
      <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm">
         <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="text-center space-y-3">
               <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto font-black text-xl">1</div>
               <h4 className="font-bold text-gray-800">Invite Friends</h4>
               <p className="text-sm text-gray-500">Share your link with agency owners or media buyers.</p>
            </div>
            <div className="text-center space-y-3">
               <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto font-black text-xl">2</div>
               <h4 className="font-bold text-gray-800">They Spend</h4>
               <p className="text-sm text-gray-500">When their total top-up reaches ${MIN_TOPUP_FOR_COMMISSION}, you get paid.</p>
            </div>
            <div className="text-center space-y-3">
               <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto font-black text-xl">3</div>
               <h4 className="font-bold text-gray-800">Unlock Milestones</h4>
               <p className="text-sm text-gray-500">Reach referral targets to unlock huge cash bonuses.</p>
            </div>
         </div>
      </div>

      {/* ================= MILESTONES PROGRESS ================= */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Milestones Progress</h2>
            <span className="px-4 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-black rounded-full uppercase tracking-wider">Cash Rewards</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {LEVEL1_MILESTONES.map((m, i) => {
            const progress = Math.min((completedUsers / m.count) * 100, 100).toFixed(0);
            const completed = completedUsers >= m.count;

            return (
              <div key={i} className={`bg-white border rounded-3xl p-8 transition-all ${completed ? "border-green-500 bg-green-50/30" : "border-gray-100 shadow-sm"}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className={`p-3 rounded-2xl ${completed ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                    <Gift size={24} />
                  </div>
                  <span className={`text-lg font-black ${completed ? "text-green-600" : "text-gray-400"}`}>${m.reward}</span>
                </div>
                <h3 className="font-bold text-xl text-gray-800">{m.count} Referrals</h3>
                <div className="mt-6 space-y-2">
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${completed ? "bg-green-500" : "bg-indigo-600"}`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
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
    indigo: "bg-indigo-50 text-indigo-600",
    teal: "bg-teal-50 text-teal-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{label}</p>
          <h3 className="text-4xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{value}</h3>
          <p className="text-xs font-medium text-gray-500">{sub}</p>
        </div>
        <div className={`p-4 rounded-2xl ${gradients[color]}`}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  );
};
