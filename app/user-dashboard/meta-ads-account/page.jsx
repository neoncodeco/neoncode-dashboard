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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2 md:pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Meta Ads Account Panel
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your ad accounts and requests efficiently.
          </p>
        </div>
        <button
          onClick={() => setIsReqAdAcModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <Plus size={18} />
          Request New Account
        </button>
      </div>

      <AdAccountUi />
    </div>
  );
}
