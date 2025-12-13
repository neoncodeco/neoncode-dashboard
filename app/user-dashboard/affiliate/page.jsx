"use client";
import React, { useState } from 'react';
import { 
  DollarSign, 
  Users, 
  Copy, 
  Check, 
  TrendingUp, 
  ArrowUpRight,
  Wallet
} from 'lucide-react';

// --- ডামি রেফারেল ডাটা ---
const referralsData = [
  { id: 1, user: 'alex.design@gmail.com', date: 'Today, 10:45 AM', plan: 'Pro Plan', commission: '+$15.00', status: 'Pending' },
  { id: 2, user: 'sarah.dev@yahoo.com', date: 'Yesterday', plan: 'Team Plan', commission: '+$45.00', status: 'Paid' },
  { id: 3, user: 'mike.studio@design.io', date: 'Oct 20, 2023', plan: 'Pro Plan', commission: '+$15.00', status: 'Paid' },
  { id: 4, user: 'john.doe@company.com', date: 'Oct 15, 2023', plan: 'Starter', commission: '+$5.00', status: 'Paid' },
];

export default function AffiliatePage() {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://neonstudio.com/ref/user123";

  // লিংক কপি করার ফাংশন
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* --- ১. হেডার সেকশন --- */}
      <div className="pt-16 md:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Affiliate Program</h1>
          <p className="text-gray-500 text-sm mt-1">Invite friends and earn 20% commission on every sale.</p>
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition transform hover:-translate-y-0.5">
            <Wallet size={18} /> Withdraw Funds
        </button>
      </div>

      {/* --- ২. আর্নিং ড্যাশবোর্ড (কার্ডস) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Earnings', value: '$1,240.50', sub: 'Lifetime', color: 'text-green-600', bg: 'bg-green-50', icon: DollarSign },
          { label: 'Pending Payout', value: '$125.00', sub: 'Next payout: Nov 01', color: 'text-orange-600', bg: 'bg-orange-50', icon: ClockIcon }, 
          { label: 'Total Referrals', value: '42', sub: '+5 this month', color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
        ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <h3 className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">{stat.sub}</p>
                </div>
                <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                </div>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- ৩. বাম পাশ: রেফারেল লিংক --- */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#1a1a1a] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D8FF30] rounded-full blur-[60px] opacity-20"></div>
                
                <h3 className="font-bold text-lg mb-2">Your Referral Link</h3>
                <p className="text-gray-400 text-sm mb-6">Share this link with your audience to track referrals.</p>
                
                <div className="bg-white/10 p-1.5 rounded-xl flex items-center justify-between border border-white/10">
                    <input 
                        type="text" 
                        value={referralLink} 
                        readOnly 
                        className="bg-transparent text-sm px-3 text-gray-200 outline-none w-full font-mono"
                    />
                    <button 
                        onClick={copyLink}
                        className="bg-[#D8FF30] text-black p-2 rounded-lg hover:bg-white transition"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
                
                <div className="flex gap-2 mt-6">
                     {/* সোশ্যাল শেয়ার বাটনস */}
                     {['Twitter', 'Facebook', 'LinkedIn'].map(platform => (
                         <button key={platform} className="flex-1 py-2 rounded-lg bg-white/5 text-xs font-bold hover:bg-white/10 border border-white/5 transition">
                             {platform}
                         </button>
                     ))}
                </div>
            </div>

            {/* টিপস কার্ড */}
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                <h4 className="font-bold text-purple-900 flex items-center gap-2">
                    <TrendingUp size={18} /> Pro Tip
                </h4>
                <p className="text-sm text-purple-700 mt-2">
                    Users who share their link on social media earn <span className="font-bold">3x more</span> than those who don't.
                </p>
            </div>
        </div>

        {/* --- ৪. ডান পাশ: রিসেন্ট রেফারেলস টেবিল --- */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Recent Referrals</h3>
                <button className="text-xs font-bold text-gray-500 hover:text-black">View All</button>
            </div>
            
            <div className="divide-y divide-gray-50">
                {referralsData.map((item) => (
                    <div key={item.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                {item.user.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">{item.user}</h4>
                                <p className="text-xs text-gray-400 mt-0.5">{item.date} • <span className="text-gray-500 font-medium">{item.plan}</span></p>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <p className="font-bold text-green-600 text-sm">{item.commission}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {item.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}

// আইকন ফিক্স (ClockIcon উপরে ইম্পোর্ট করা হয়নি, তাই ম্যানুয়ালি এখানে লোকাল কম্পোনেন্ট)
const ClockIcon = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);