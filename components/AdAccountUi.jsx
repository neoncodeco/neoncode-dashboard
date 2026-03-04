"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Loader2,
  DollarSign,
  Calendar,
  CreditCard,
  Wallet,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import IncreaseBudgetModal from "./IncreaseBudgetModal";
import TopupModal from "./TopupModal";

/* ================= STATUS MAPPER ================= */
const getAdStatusMeta = (status) => {
  switch (status) {
    case 1:
      return {
        label: "Active",
        className: "bg-green-100 text-green-700 ring-1 ring-green-600/20",
      };
    case 2:
      return {
        label: "Disabled",
        className: "bg-red-100 text-red-700 ring-1 ring-red-600/20",
      };
    default:
      return {
        label: "Unknown",
        className: "bg-gray-100 text-gray-500 ring-1 ring-gray-400/20",
      };
  }
};

const AdAccountUi = () => {
  const { token, userData } = useFirebaseAuth();

  const [adAccounts, setAdAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All Accounts");

  /* ---- modal state ---- */
  const [increaseModal, setIncreaseModal] = useState({
    open: false,
    adAccountId: null,
    oldLimit: null,
  });
  const [topupModal, setTopupModal] = useState(false);

  /* ================= CALCULATE TOTAL REMAINING ================= */
  // এটি সব অ্যাড অ্যাকাউন্টের বাকি ব্যালেন্স যোগ করবে
  const totalRemaining = useMemo(() => {
    return Object.values(balances).reduce((acc, curr) => {
      return acc + (Number(curr?.remaining) || 0);
    }, 0);
  }, [balances]);

  /* ================= PREPARE DYNAMIC CHART DATA ================= */
  const performanceData = useMemo(() => {
    return adAccounts.map((acc) => {
      const b = balances[acc.MetaAccountID];
      return {
        name: acc.accountName || acc.MetaAccountID.slice(-5),
        spend: b?.amountSpent || 0,
        limit: b?.spendCap || 0,
      };
    });
  }, [adAccounts, balances]);

  /* ================= FETCH AD ACCOUNTS ================= */
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const res = await fetch("/api/ads-request/list", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.ok) setAdAccounts(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  /* ================= FETCH BALANCE ================= */
  const fetchBalance = async (adAccountId) => {
    if (!adAccountId || balances[adAccountId]) return;

    try {
      const res = await fetch(
        `/api/ads-request/balance?ad_account_id=${adAccountId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();

      setBalances((prev) => ({
        ...prev,
        [adAccountId]: res.ok ? json : { error: json.error },
      }));
    } catch (err) {
      setBalances((prev) => ({
        ...prev,
        [adAccountId]: { error: err.message },
      }));
    }
  };

  useEffect(() => {
    adAccounts.forEach((acc) => {
      if (acc?.MetaAccountID) fetchBalance(acc.MetaAccountID);
    });
  }, [adAccounts]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* --- ৩. ওয়ালেট এবং ব্যালেন্স কার্ডস --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Wallet Balance */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Wallet Balance</p>
                <h3 className="text-3xl font-bold text-gray-800"> ${userData?.walletBalance}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Wallet size={20} />
              </div>
            </div>
            <div className="w-full bg-blue-50/50 py-1.5 px-3 rounded-lg text-xs font-medium text-blue-600 inline-block">
              Available USD
            </div>
          </div>

          {/* Card 2: USD Rate */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">USD Rate</p>
                <h3 className="text-3xl font-bold text-gray-800">150.00</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="w-full bg-emerald-50/50 py-1.5 px-3 rounded-lg text-xs font-medium text-emerald-600 inline-block">
              BDT to USD
            </div>
          </div>

          {/* Card 3: Top Up */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Top Up Balance</p>
                <h3 className="text-3xl font-bold text-gray-800">${userData?.topupBalance}</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar size={20} />
              </div>
            </div>
            <div className="w-full bg-indigo-50/50 py-1.5 px-3 rounded-lg text-xs font-medium text-indigo-600 inline-block">
              Cumulative Topup
            </div>
          </div>

          {/* Card 4: Remaining (DYNAMIC DATA) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Remaining</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  ${totalRemaining.toFixed(2)}
                </h3>
              </div>
              <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="w-full bg-orange-50/50 py-1.5 px-3 rounded-lg text-xs font-medium text-orange-600 inline-block">
              Remaining budget
            </div>
          </div>
        </div>

        {/* ---------- ১. পারফরম্যান্স চার্ট (DYNAMIC) ---------- */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Spending Overview</h2>
                <p className="text-xs text-gray-500">Real-time spend tracking across all accounts</p>
              </div>
            </div>
            
            <div className="relative">
              <select
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>All Accounts</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 11 }} 
                  tickFormatter={(val) => `$${val}`} 
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`$${value}`, 'Amount Spent']}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSpend)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---------- ২. মেইন টেবিল সেকশন ---------- */}
        <div className="bg-[#0d1a34] text-black rounded-3xl shadow-sm border border-[#2b4069] overflow-hidden">
          <div className="px-6 py-5 flex flex-col md:flex-row md:justify-between gap-4 border-b border-[#24385e]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-lg text-white">
                <Wallet size={18}/>
              </div>
              <h2 className="text-lg font-bold">Ad Accounts List</h2>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search account..."
                  className="pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition-all"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#101f3d] text-[11px] uppercase text-[#9fb7e7] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Account Name</th>
                  <th className="px-6 py-4 text-left">Meta Ad ID</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Spend Cap</th>
                  <th className="px-6 py-4 text-left">Spent</th>
                  <th className="px-6 py-4 text-left">Remaining</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#24385e]">
                {adAccounts.map((account, i) => {
                  const balance = balances[account.MetaAccountID];
                  const statusMeta = balance && !balance.error ? getAdStatusMeta(balance.status) : null;
                  const showIncrease = (userData?.walletBalance || 0) > 0;
                  const showTopup = (userData?.walletBalance || 0) === 0;

                  return (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-700">
                        {account.accountName || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-blue-600 bg-blue-50/50 rounded-lg">
                        {account.MetaAccountID}
                      </td>
                      <td className="px-6 py-4">
                        {statusMeta ? (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        ) : (
                          <Loader2 className="animate-spin w-4 h-4 text-gray-300" />
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-600">
                        {balance ? `$${balance.spendCap}` : "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-rose-500">
                        {balance ? `$${balance.amountSpent}` : "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        {balance ? `$${balance.remaining}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {showIncrease && (
                            <button
                              onClick={() => setIncreaseModal({
                                open: true,
                                adAccountId: account?.MetaAccountID,
                                oldLimit: balance?.spendCap,
                              })}
                              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[11px] font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                            >
                              Increase Budget
                            </button>
                          )}
                          {showTopup && (
                            <button
                              onClick={() => setTopupModal(true)}
                              className="px-4 py-2 rounded-xl bg-orange-500 text-white text-[11px] font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
                            >
                              Top Up
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------- MODALS ---------- */}
      <IncreaseBudgetModal
        open={increaseModal.open}
        adAccountId={increaseModal.adAccountId}
        oldLimit={increaseModal.oldLimit}
        onClose={() => setIncreaseModal({ open: false, adAccountId: null, oldLimit: null })}
        onSuccess={() => setBalances({})}
      />
      <TopupModal open={topupModal} onClose={() => setTopupModal(false)} />
    </>
  );
};

export default AdAccountUi;
