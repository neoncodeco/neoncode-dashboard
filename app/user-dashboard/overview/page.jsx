"use client";
import React from 'react';
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { 
  Wallet, TrendingUp, Users, ArrowUpRight, 
  CreditCard, DollarSign, Target, 
  Zap, ArrowRightLeft, ShieldCheck, Clock,
  Smartphone, Banknote, HelpCircle
} from 'lucide-react';
import Link from 'next/link';

const OverviewPage = () => {
  const { userData } = useFirebaseAuth();

  if (!userData) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  const stats = userData.referralStats || {};
  
  // Chart Data: Financial Summary
  const chartData = [
    { name: 'Wallet', value: userData.walletBalance || 0, color: '#3b82f6' },
    { name: 'Income', value: stats.totalReferIncome || 0, color: '#10b981' },
    { name: 'Payout', value: stats.totalPayout || 0, color: '#f43f5e' },
    { name: 'Topup', value: userData.topupBalance || 0, color: '#8b5cf6' },
  ];

  // Logic for Margin
  const totalFlow = (stats.totalReferIncome || 0) + (stats.totalPayout || 0);
  const marginPercentage = totalFlow > 0 
    ? ((stats.totalReferIncome / totalFlow) * 100).toFixed(1) 
    : 0;

  const StatCard = ({ title, value, icon: Icon, color, suffix = "$" }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">
            {value?.toLocaleString()} <span className="text-sm font-medium">{suffix}</span>
          </h3>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-white min-h-screen pt-20 p-4 md:p-8">
      {/* 1. Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 font-medium">Monitoring your performance and wallet activities.</p>
        </div>
        <div className="flex justify-between  items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
           <span className="px-4 text-sm font-bold text-gray-600">ID: {userData.userId?.slice(-6)}</span>
           <Link
            href="/user-dashboard/payment-methods"
           className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
             <Zap size={16} />Topup
           </Link>
        </div>
      </div>

      {/* 2. Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
        <StatCard title="Wallet Balance" value={userData.walletBalance} icon={Wallet} color="bg-blue-600" />
        <StatCard title="Topup Balance" value={userData.topupBalance} icon={CreditCard} color="bg-indigo-600" />
        <StatCard title="Total Referrers" value={stats.totalReferrers} icon={Users} color="bg-orange-500" suffix="Users" />
        <StatCard title="Refer Income" value={stats.totalReferIncome} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title="Total Payout" value={stats.totalPayout} icon={DollarSign} color="bg-rose-600" />
      </div>

      {/* 3. Main Dashboard Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column (Charts & Lists) */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Main Chart Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <ArrowRightLeft className="text-blue-600" /> Activity Analytics
              </h2>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs font-bold text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Income</span>
                <span className="flex items-center gap-1 text-xs font-bold text-gray-400"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Payout</span>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
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

          {/* New Section: Payout Methods & Security */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Banknote className="text-blue-600" size={20} /> Payout Methods
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-xs text-center">bK</div>
                    <span className="text-sm font-bold text-gray-700">bKash Payout</span>
                  </div>
                  <span className="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs text-center">Ng</div>
                    <span className="text-sm font-bold text-gray-700">Nagad Payout</span>
                  </div>
                  <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded-full font-bold">SETUP NEEDED</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Identity Verified</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">Your account is under secure monitoring. All transactions are encrypted and protected by Neon Studio Guard.</p>
              <button className="mt-4 text-blue-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                Security Settings <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Efficiency Card */}
          <div className="bg-gray-900 p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 text-center">
              <h2 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">Referral conversion</h2>
              <div className="relative inline-flex items-center justify-center mb-6">
                 {/* Circular Progress Look */}
                 <div className="text-6xl font-black">{marginPercentage}%</div>
                 <div className="absolute -inset-8 border-4 border-emerald-500/20 rounded-full"></div>
              </div>
              <div className="w-full bg-gray-800 h-2.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${marginPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-8 leading-relaxed">
                You've successfully invited <span className="text-white font-bold">{stats.totalReferrers} users</span> with a total earning of <span className="text-white font-bold">৳{stats.totalReferIncome}</span>.
              </p>
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px]"></div>
          </div>

          {/* Recent Activity List (Real Data UI) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock size={18} className="text-orange-500" /> Account Status
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-2 h-12 bg-emerald-500 rounded-full shrink-0"></div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Last Updated</p>
                  <p className="text-sm font-bold text-gray-700">
                    {new Date(userData.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-12 bg-blue-500 rounded-full shrink-0"></div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Member Since</p>
                  <p className="text-sm font-bold text-gray-700">
                    {new Date(userData.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-50">
               <div className="flex items-center gap-3 text-gray-500 text-sm hover:text-blue-600 cursor-pointer transition-all">
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