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
    <div className="user-dashboard-theme-scope min-h-screen space-y-8 bg-transparent px-6 pt-4 md:px-8 md:pt-0">
      <ReqAdAcModal
        isOpen={isReqAdAcModalOpen}
        onClose={() => setIsReqAdAcModalOpen(false)}
      />

      {/* --- ১. হেডার সেকশন (ওয়েলকাম মেসেজ এবং রিকোয়েস্ট বাটন) --- */}
      <div className="dashboard-subpanel overflow-hidden rounded-[2rem] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ">
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
