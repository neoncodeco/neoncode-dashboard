"use client";
import React, { useEffect, useState } from "react";
import {
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Search,
  Filter,
  FileText,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function TransactionsPage() {

  const { token, role, loading: authLoading } = useFirebaseAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ------------ Fetch Payments --------------
  const loadPayments = async () => {
    if (!token) return; // wait until auth ready

    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.ok) {
        setPayments(data.payments);
      } else {
        console.log("API Error:", data.error);
      }
    } catch (e) {
      console.log("Fetch error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, [token]); // wait for token

  // ------------ Approve / Reject Handler --------------
  const handleAction = async (userUid, action) => {
    const res = await fetch("/api/admin/payments/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userUid, action }),
    });

    const data = await res.json();

    if (data.ok) {
      alert(data.message);
      loadPayments(); // reload table
    } else {
      alert("Error: " + data.error);
    }
  };

  // ------------ Status Color -------------
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-orange-100 text-orange-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* Header */}
      <div className="pt-12 md:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor all financial activities.</p>
        </div>

        <div className="flex gap-3">
          {/* <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
            <Calendar size={16} /> Select Date
          </button> */}
          <button className="flex items-center gap-2 px-4 py-2 bg-[#D8FF30] text-black rounded-lg text-sm font-bold hover:bg-[#cbf028] transition shadow-sm">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Search */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by UID or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition">
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                <th className="p-4 pl-6">User UID</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {loading ? (
                <tr><td className="p-4">Loading...</td></tr>
              ) : (
                payments
                  .filter((p) =>
                    p.userUid.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((p, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition group">
                      
                      <td className="p-4 pl-6 font-mono font-bold text-gray-700">
                        {p.userUid}
                      </td>

                      <td className="p-4 font-bold text-green-600">+{p.amount}</td>

                      <td className="p-4 text-gray-600">{p.method || "N/A"}</td>

                      <td className="p-4 text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="p-4 text-right pr-6 flex gap-2 justify-end">

                        {/* Only show buttons if pending */}
                        {p.status.toLowerCase() === "pending" && (
                          <>
                            <button
                              onClick={() => handleAction(p.userUid, "approve")}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-bold flex items-center gap-1"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>

                            <button
                              onClick={() => handleAction(p.userUid, "reject")}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-bold flex items-center gap-1"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
