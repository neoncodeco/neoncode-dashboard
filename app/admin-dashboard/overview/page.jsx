"use client";
import React, { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  Activity,
  Layers,
  ClipboardList,
  Share2,
  Ticket,
  MoreHorizontal,
  TrendingUp,
  Download,
  Filter
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Link from "next/link";

export default function AdminDashboard() {
  const { token } = useFirebaseAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("all"); // Default range

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/stats?range=${range}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await res.json();
        if (result.ok) setData(result.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, range]);

  // CSV Download Logic
  const handleDownload = () => {
    if (!data) return;
    const csvRows = [
      ["Metric", "Value"],
      ["Total Revenue", data.metrics.totalRevenue],
      ["Total Withdraw", data.metrics.totalWithdraw],
      ["Total Budget", data.metrics.totalBudget],
      ["User Count", data.counts.users],
      ["Date Range", range],
      ["Report Generated", new Date().toLocaleString()]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${range}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const metricsConfig = [
    { label: "Total Transactions", val: data?.metrics?.totalRevenue, icon: DollarSign, color: "text-green-600", bg: "bg-green-50", suffix: "$" },
    { label: "Total Withdraw", val: data?.metrics?.totalWithdraw, icon: Share2, color: "text-red-600", bg: "bg-red-50", suffix: "$" },
    { label: "Monthly Budget", val: data?.metrics?.totalBudget, icon: Layers, color: "text-blue-600", bg: "bg-blue-50", suffix: "$" },
    { label: "Limit Changes", val: data?.metrics?.totalLimitChange, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50", suffix: "$" },
  ];

  const countsConfig = [
    { label: "Users", key: "users", icon: Users, color: "text-gray-600" },
    { label: "Tickets", key: "tickets", icon: Ticket, color: "text-gray-600" },
    { label: "Ad Requests", key: "adAccountRequests", icon: Layers, color: "text-gray-600" },
    { label: "Spend Logs", key: "spendingLogs", icon: Activity, color: "text-gray-600" },
  ];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-14 md:p-8 space-y-8 pb-12 bg-[#fcfcfc]">
      
      {/* --- ১. হেডার --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-10 md:pt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-gray-500 text-sm">Real-time insights for <span className="text-black font-bold capitalize">{range}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Filter size={16} className="text-gray-400 mr-2" />
            <select 
              value={range} 
              onChange={(e) => setRange(e.target.value)}
              className="text-sm font-bold bg-transparent outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <button 
            onClick={handleDownload}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition flex items-center gap-2"
          >
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      {/* --- ২. ফিন্যান্সিয়াল মেট্রিক্স কার্ডস --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {metricsConfig.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {item.val?.toLocaleString()} {item.suffix}
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                <item.icon size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded">
              <TrendingUp size={12} /> Live Updates
            </div>
          </div>
        ))}
      </div>

      {/* --- ৩. কালেকশন কাউন্ট ছোট কার্ডস (Sub Cards) --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {countsConfig.map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
              <item.icon color="blue" size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{item.label}</p>
              <p className="text-lg font-bold text-gray-800">{data?.counts[item.key] || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- ৪. রেভিনিউ/ইউজার চার্ট --- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 underline decoration-lime-400 decoration-4">Registration Analytics</h3>
          <div className="text-sm text-gray-500 font-medium px-3 py-1 bg-gray-50 rounded-lg">Annual View</div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D8FF30" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#D8FF30" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Area type="monotone" dataKey="users" stroke="#214311" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- ৫. রিসেন্ট ইউজার টেবিল (১০ জন ইউজার) --- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Recent 10 Registrations</h3>
          <Link href="/admin-dashboard/users"className="text-sm text-blue-600 font-bold hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-50 uppercase tracking-wider">
                <th className="pb-3 font-semibold">User Details</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Wallet</th>
                <th className="pb-3 font-semibold text-right">Registered</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentUsers.map((user, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{user.name || "Unknown"}</p>
                        <p className="text-[11px] text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4">
                    <p className="text-sm font-bold text-green-700">{user.walletBalance || 0} $</p>
                  </td>
                  <td className="py-4 text-right">
                    <p className="text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}