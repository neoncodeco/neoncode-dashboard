"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Wallet,
  DollarSign,
  CreditCard,
  Calendar,
  Plus,
  Search,
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  Zap,
  ChevronDown,
  Bell,
  User,
} from "lucide-react";
import ReqAdAcModal from "@/components/ReqAdAcModal";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Image from "next/image";
import AdAccountUi from "@/components/AdAccountUi";
import LogoutModal from "@/components/LogoutModal";

// --- ডামি ডাটা (চার্টের জন্য) ---
const performanceData = [
  { name: "Mon", spend: 120, clicks: 240 },
  { name: "Tue", spend: 180, clicks: 320 },
  { name: "Wed", spend: 150, clicks: 280 },
  { name: "Thu", spend: 250, clicks: 450 },
  { name: "Fri", spend: 210, clicks: 390 },
  { name: "Sat", spend: 310, clicks: 520 },
  { name: "Sun", spend: 280, clicks: 480 },
];

export default function Overview() {
  const [filter, setFilter] = useState("This Week");
  const [isReqAdAcModalOpen, setIsReqAdAcModalOpen] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
   const [showLogoutModal, setShowLogoutModal] = useState(false); 

  const { user , userData } = useFirebaseAuth();

  return (
    <div className="min-h-screen bg-gray-50/50 px-6 py-4 md:px-8  space-y-8">
      <ReqAdAcModal
        isOpen={isReqAdAcModalOpen}
        onClose={() => setIsReqAdAcModalOpen(false)}
      />
      {showLogoutModal && (
        <LogoutModal setShowLogoutModal={setShowLogoutModal} />
      )}

      {/* Top Right Header */}
      <div className="sticky top-0 right-0 w-full flex justify-end p-0 md:p-0 border-b border-gray-300  bg-gray-50/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-6 pb-2 px-4 md:px-0 relative">
          {/* Notification Button */}
          <button
            onClick={() => {
              setOpenNotification(!openNotification);
              setOpenProfile(false);
            }}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 border border-white"></span>
          </button>

          {user && openNotification && (
            <div className="absolute top-12 right-0 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-20">
              <h3 className="text-gray-700 font-semibold text-sm border-b pb-2">
                Notifications
              </h3>

              <div className="mt-2 space-y-2">
                <p className="text-sm text-gray-600 py-1">
                  🎉 Your account request approved!
                </p>
                <p className="text-sm text-gray-600 py-1">
                  💰 Balance updated successfully
                </p>
                <p className="text-sm text-gray-600 py-1">
                  📢 New offer available!
                </p>
              </div>

              <button className="mt-3 w-full text-center text-blue-600 text-xs font-medium">
                View all
              </button>
            </div>
          )}

          {/* Profile Button */}
          <button
            onClick={() => {
              setOpenProfile(!openProfile);
              setOpenNotification(false);
            }}
            className="text-white  rounded-full transition shadow-md"
          >
            {!user ? (
              <User
                size={22}
                className="bg-purple-600 hover:bg-purple-700 p-2 rounded-full"
              />
            ) : (
              <Image
                src={user?.photoURL}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full cursor-pointer"
              />
            )}
          </button>

          {/* 👤 Profile Dropdown */}

          {user && openProfile && (
            <div className="absolute top-12 right-0 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-20">
              <div className="flex items-center gap-3 border-b pb-3">
                <Image
                  src={user?.photoURL}
                  alt="Profile"
                  width={42}
                  height={42}
                  className="rounded-full"
                />
                <div>
                  <p className="text-gray-800 font-semibold text-sm">
                    {user?.displayName}
                  </p>
                  <p className="text-gray-500 text-xs">{user?.email}</p>
                </div>
              </div>

              <button className="w-full text-left py-2 px-2 hover:bg-gray-100 transition text-sm text-gray-700 mt-2 rounded-md">
                Manage Account
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full text-left py-2 px-2 hover:bg-gray-100 transition text-sm text-gray-700 rounded-md"
              >
                Log Out
              </button>

              <p className="text-center pt-2 text-[11px] text-gray-400">
                Secured by Neon
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- ১. হেডার সেকশন (ওয়েলকাম মেসেজ এবং রিকোয়েস্ট বাটন) --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2 md:pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, Quraner! 👋
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

      {/* --- ৩. ওয়ালেট এবং ব্যালেন্স কার্ডস --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Wallet Balance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                Wallet Balance
              </p>
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
              <h3 className="text-3xl font-bold text-gray-800">132.00</h3>
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
              <p className="text-gray-500 text-sm font-medium mb-1">Top Up</p>
              <h3 className="text-3xl font-bold text-gray-800">${userData?.topupBalance}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar size={20} />
            </div>
          </div>
          <div className="w-full bg-indigo-50/50 py-1.5 px-3 rounded-lg text-xs font-medium text-indigo-600 inline-block">
            Dec 01 - Dec 31, 2025
          </div>
        </div>

        {/* Card 4: Remaining */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                Remaining
              </p>
              <h3 className="text-3xl font-bold text-gray-800">$0.01</h3>
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
      {/* --- ২. পারফরম্যান্স চার্ট --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Ad Performance Overview
          </h2>
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>This Week</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={performanceData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSpend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AdAccountUi />
    </div>
  );
}
