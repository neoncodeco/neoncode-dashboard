"use client";

import React, { useState } from "react";
import {
  Plus,
} from "lucide-react";
import ReqAdAcModal from "@/components/ReqAdAcModal";
import AdAccountUi from "@/components/AdAccountUi";


export default function Overview() {
  const [isReqAdAcModalOpen, setIsReqAdAcModalOpen] = useState(false);

 

  
  return (
    <div className="min-h-screen px-6 pt-20 md:pt-0 md:px-8 space-y-8 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_48%),linear-gradient(180deg,#081227_0%,#0d1d3b_100%)]">
      <ReqAdAcModal
        isOpen={isReqAdAcModalOpen}
        onClose={() => setIsReqAdAcModalOpen(false)}
      />

      {/* --- ১. হেডার সেকশন (ওয়েলকাম মেসেজ এবং রিকোয়েস্ট বাটন) --- */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(17,31,58,0.95),rgba(9,19,40,0.96))] p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.95)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">
              <Plus size={12} />
              Meta Ads Access
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Meta Ads Account Panel
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Request new accounts, monitor live balances, and manage production ad spend from one dashboard.
            </p>
          </div>
          <button
            onClick={() => setIsReqAdAcModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white transition-all hover:bg-blue-600 shadow-lg shadow-blue-900/30"
          >
            <Plus size={18} />
            Request New Account
          </button>
        </div>
      </div>

      <AdAccountUi />
    </div>
  );
}
