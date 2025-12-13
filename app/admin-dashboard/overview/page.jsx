"use client";
import React from 'react';
import { 
  Users, DollarSign, Activity, TrendingUp, ArrowUpRight, 
  MoreHorizontal, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- ডামি ডাটা (চার্ট) ---
const data = [
  { name: 'Jan', users: 400, revenue: 2400 },
  { name: 'Feb', users: 300, revenue: 1398 },
  { name: 'Mar', users: 200, revenue: 9800 },
  { name: 'Apr', users: 278, revenue: 3908 },
  { name: 'May', users: 189, revenue: 4800 },
  { name: 'Jun', users: 239, revenue: 3800 },
  { name: 'Jul', users: 349, revenue: 4300 },
];

// --- ডামি ডাটা (রিসেন্ট ইউজার) ---
const recentUsers = [
  { name: 'Alice Freeman', email: 'alice@gmail.com', status: 'Active', date: 'Today' },
  { name: 'Mark Taylor', email: 'mark.t@yahoo.com', status: 'Pending', date: 'Yesterday' },
  { name: 'John Smith', email: 'john@outlook.com', status: 'Active', date: 'Dec 05' },
  { name: 'Sarah Connor', email: 'sarah@tech.io', status: 'Banned', date: 'Dec 02' },
];

// --- ডামি ডাটা (অ্যাক্টিভিটি লগ) ---
const activities = [
  { text: 'New subscription purchase ($299)', time: '5 mins ago', type: 'success' },
  { text: 'Server CPU usage high (85%)', time: '1 hour ago', type: 'warning' },
  { text: 'User "Mike" requested refund', time: '3 hours ago', type: 'error' },
  { text: 'New project created by Team A', time: '5 hours ago', type: 'info' },
];

export default function AdminDashboard() {
  
  // স্ট্যাটাস ব্যাজ কালার
  const getStatusColor = (status) => {
    switch(status) {
        case 'Active': return 'bg-green-100 text-green-700';
        case 'Pending': return 'bg-orange-100 text-orange-700';
        case 'Banned': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 pb-12">
      
      {/* --- ১. হেডার --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl pt-12 md:pt-0 font-bold text-gray-900">Admin Overview</h1>
            <p className="text-gray-500 text-sm">Welcome back, Super Admin.</p>
        </div>
        <button className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition">
            Download Report
        </button>
      </div>

      {/* --- ২. স্ট্যাটাস কার্ডস --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
            { label: 'Total Users', value: '12,345', icon: Users, color: 'text-blue-600', trend: '+12%' },
            { label: 'Total Revenue', value: '$45,231', icon: DollarSign, color: 'text-green-600', trend: '+8.2%' },
            { label: 'Active Subs', value: '3,422', icon: Activity, color: 'text-purple-600', trend: '+5.1%' },
            { label: 'Growth', value: '24.5%', icon: TrendingUp, color: 'text-orange-600', trend: '+2.4%' },
        ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                    </div>
                    <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                        <stat.icon size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded">
                    <ArrowUpRight size={12} /> {stat.trend} from last month
                </div>
            </div>
        ))}
      </div>

      {/* --- ৩. রেভিনিউ চার্ট --- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Revenue Analytics</h3>
            <select className="bg-gray-50 border border-gray-200 text-sm font-medium px-3 py-1 rounded-lg outline-none">
                <option>This Year</option>
                <option>Last Year</option>
            </select>
        </div>
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D8FF30" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#D8FF30" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <Tooltip contentStyle={{backgroundColor: '#111827', color: '#fff', borderRadius: '8px', border: 'none'}} />
                    <Area type="monotone" dataKey="revenue" stroke="#214311" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* --- ৪. নতুন সেকশন: রিসেন্ট ইউজার এবং অ্যাক্টিভিটি লগ --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ৪.১ রিসেন্ট রেজিস্ট্রেশন (টেবিল) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Registrations</h3>
                <button className="text-xs text-blue-600 font-bold hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                            <th className="py-3 font-medium">User</th>
                            <th className="py-3 font-medium">Date</th>
                            <th className="py-3 font-medium">Status</th>
                            <th className="py-3 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentUsers.map((user, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition">
                                <td className="py-3">
                                    <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                    <p className="text-xs text-gray-400">{user.email}</p>
                                </td>
                                <td className="py-3 text-sm text-gray-500">{user.date}</td>
                                <td className="py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(user.status)}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="py-3 text-right">
                                    <button className="text-gray-400 hover:text-black"><MoreHorizontal size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* ৪.২ সিস্টেম অ্যাক্টিভিটি লগ */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">System Activity</h3>
            <div className="space-y-6 relative">
                {/* ভার্টিকাল লাইন */}
                <div className="absolute left-2.5 top-2 h-full w-0.5 bg-gray-100"></div>

                {activities.map((act, i) => (
                    <div key={i} className="flex gap-4 relative">
                        <div className={`w-5 h-5 rounded-full border-2 border-white shrink-0 z-10 
                            ${act.type === 'success' ? 'bg-green-500' : 
                              act.type === 'warning' ? 'bg-orange-500' : 
                              act.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}>
                        </div>
                        <div>
                            <p className="text-sm text-gray-700 font-medium leading-tight">{act.text}</p>
                            <p className="text-xs text-gray-400 mt-1">{act.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>

    </div>
  );
}