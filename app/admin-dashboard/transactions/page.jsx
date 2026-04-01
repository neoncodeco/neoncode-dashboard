"use client";
import React, { useCallback, useEffect, useState } from "react";
import { formatBdt, formatUsd } from "@/lib/currency";
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
import Swal from "sweetalert2";

export default function TransactionsPage() {

  const { token, role, loading: authLoading } = useFirebaseAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ------------ Fetch Payments --------------
  const loadPayments = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      void loadPayments();
    }, 0);
    return () => clearTimeout(timer);
  }, [token, loadPayments]); // wait for token

  // ------------ Approve / Reject Handler --------------
  const handleAction = async (userUid, action) => {
    const actionLabel = action === "approve" ? "approve" : "reject";
    const confirmResult = await Swal.fire({
      title: `${action === "approve" ? "Approve" : "Reject"} payment?`,
      text: `You are about to ${actionLabel} this transaction.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: action === "approve" ? "Yes, approve" : "Yes, reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: action === "approve" ? "#059669" : "#dc2626",
      background: "#ffffff",
      color: "#0f172a",
    });

    if (!confirmResult.isConfirmed) return;

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
      await Swal.fire({
        title: action === "approve" ? "Payment approved" : "Payment rejected",
        text: data.message,
        icon: "success",
        confirmButtonColor: action === "approve" ? "#059669" : "#2563eb",
        background: "#ffffff",
        color: "#0f172a",
      });
      loadPayments(); // reload table
    } else {
      await Swal.fire({
        title: "Action failed",
        text: data.error || "Something went wrong.",
        icon: "error",
        confirmButtonColor: "#dc2626",
        background: "#ffffff",
        color: "#0f172a",
      });
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
    <div className="space-y-6 p-4  sm:p-6  md:space-y-8 md:p-8 md:pt-8">

      {/* Header */}
      <div className="flex flex-col gap-4 pt-2 sm:pt-4 md:flex-row md:items-center md:justify-between md:pt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor all financial activities.</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          {/* <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
            <Calendar size={16} /> Select Date
          </button> */}
          <button className="admin-accent-button flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* Search */}
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-4 md:flex-row">
          <div className="relative max-w-md flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by UID or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <button className="admin-secondary-button flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition">
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
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

                      <td className="p-4">
                        {(Number(p.creditedUsdAmount) || 0) > 0 ? (
                          <div className="text-lg font-extrabold text-emerald-600">{formatUsd(p.creditedUsdAmount)}</div>
                        ) : (
                          <div className="text-lg font-extrabold text-emerald-600">{formatBdt(p.amountBdt ?? p.amount)}</div>
                        )}
                        <div className="text-xs font-semibold text-gray-500">
                          {formatBdt(p.amountBdt ?? p.amount)} deposit
                        </div>
                      </td>

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
                              className="flex items-center gap-1 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-bold text-emerald-200"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>

                            <button
                              onClick={() => handleAction(p.userUid, "reject")}
                              className="flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-1 font-bold text-red-200"
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
