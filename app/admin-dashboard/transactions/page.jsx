"use client";
import React, { useCallback, useEffect, useState } from "react";
import { formatBdt, formatUsd } from "@/lib/currency";
import { formatPaymentMethod } from "@/lib/displayFormatters";
import {
  Banknote, ArrowUpRight, Download, Search, Filter,
  CheckCircle, XCircle, Clock, DollarSign, Pencil,
} from "lucide-react";
import PaymentProofPreviewModal, { PaymentProofField } from "@/components/admin/PaymentProofPreviewModal";
import AdminPaymentEditModal from "@/components/admin/AdminPaymentEditModal";
import { useAdminDashboardCache } from "@/hooks/useAdminDashboardCache";
import useAppAuth from "@/hooks/useAppAuth";
import Swal from "sweetalert2";

const statusConfig = (status) => {
  switch (status?.toLowerCase()) {
    case "approved": return { label: "Approved", cls: "text-emerald-700 border-emerald-200", dot: "#10b981" };
    case "rejected": return { label: "Rejected", cls: "text-red-600 border-red-200",         dot: "#ef4444" };
    default:         return { label: "Pending",  cls: "text-amber-600 border-amber-200",     dot: "#f59e0b" };
  }
};

function SkeletonRow() {
  return (
    <tr>
      <td className="p-4 pl-6">
        <div className="space-y-2">
          <div className="admin-skeleton h-3.5 w-28 rounded-full" />
          <div className="admin-skeleton h-2.5 w-36 rounded-full" />
        </div>
      </td>
      <td className="p-4"><div className="admin-skeleton h-5 w-20 rounded-lg" /></td>
      <td className="p-4"><div className="admin-skeleton h-3.5 w-16 rounded-full" /></td>
      <td className="p-4"><div className="admin-skeleton h-10 w-44 rounded-xl" /></td>
      <td className="p-4"><div className="admin-skeleton h-3.5 w-20 rounded-full" /></td>
      <td className="p-4"><div className="admin-skeleton h-6 w-16 rounded-lg" /></td>
      <td className="p-4 pr-6 text-right"><div className="admin-skeleton ml-auto h-7 w-24 rounded-lg" /></td>
    </tr>
  );
}

export default function TransactionsPage() {
  const { token } = useAppAuth();
  const { getCache, setCache } = useAdminDashboardCache();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [previewPayment, setPreviewPayment] = useState(null);
  const [editPayment, setEditPayment] = useState(null);

  const loadPayments = useCallback(async (options = {}) => {
    if (!token) return;
    if (!options.force) {
      const cached = getCache("admin-transactions:list:v2");
      if (cached) { setPayments(cached); setLoading(false); return; }
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/payments/list", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.ok) { setPayments(data.payments); setCache("admin-transactions:list:v2", data.payments || []); }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [getCache, setCache, token]);

  useEffect(() => {
    if (!token) return;
    const t = setTimeout(() => loadPayments(), 0);
    return () => clearTimeout(t);
  }, [token, loadPayments]);

  const handleAction = async (userUid, action) => {
    const confirmed = await Swal.fire({
      title: `${action === "approve" ? "Approve" : "Reject"} payment?`,
      text: `You are about to ${action} this transaction.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: action === "approve" ? "Yes, approve" : "Yes, reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: action === "approve" ? "#059669" : "#dc2626",
      background: "#ffffff",
      color: "#0f172a",
    });
    if (!confirmed.isConfirmed) return;

    const res  = await fetch("/api/admin/payments/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userUid, action }),
    });
    const data = await res.json();
    if (data.ok) {
      await Swal.fire({
        title: action === "approve" ? "Payment approved" : "Payment rejected",
        text: data.message, icon: "success",
        confirmButtonColor: action === "approve" ? "#059669" : "#2563eb",
        background: "#ffffff", color: "#0f172a",
      });
      loadPayments({ force: true });
    } else {
      await Swal.fire({ title: "Action failed", text: data.error || "Something went wrong.", icon: "error", confirmButtonColor: "#dc2626", background: "#ffffff", color: "#0f172a" });
    }
  };

  const filtered = payments.filter((p) =>
    `${p.userName ?? ""} ${p.userUid ?? ""} ${p.userEmail ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount  = payments.filter((p) => p.status?.toLowerCase() === "pending").length;
  const approvedTotal = payments.filter((p) => p.status?.toLowerCase() === "approved").reduce((s, p) => s + (p.amountBdt ?? p.amount ?? 0), 0);

  return (
    <div className="space-y-5 md:space-y-6">
      {previewPayment ? (
        <PaymentProofPreviewModal payment={previewPayment} onClose={() => setPreviewPayment(null)} />
      ) : null}
      {editPayment ? (
        <AdminPaymentEditModal
          payment={editPayment}
          token={token}
          onClose={() => setEditPayment(null)}
          onSaved={() => loadPayments({ force: true })}
        />
      ) : null}

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Transactions</h1>
          <p className="mt-0.5 text-sm text-gray-500">Monitor and approve all financial activities</p>
        </div>
        <button className="admin-accent-button flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold">
          <Download size={15} /> Export Report
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4" style={{ borderLeft: "3px solid #3b82f6" }}>
          <div className="rounded-xl p-2.5" style={{ background: "#3b82f618" }}>
            <Banknote size={18} style={{ color: "#3b82f6" }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Total Records</p>
            <p className="mt-0.5 text-xl font-black text-gray-900">{loading ? "—" : payments.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4" style={{ borderLeft: "3px solid #f59e0b" }}>
          <div className="rounded-xl p-2.5" style={{ background: "#f59e0b18" }}>
            <Clock size={18} style={{ color: "#f59e0b" }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Pending</p>
            <p className="mt-0.5 text-xl font-black text-gray-900">{loading ? "—" : pendingCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4" style={{ borderLeft: "3px solid #10b981" }}>
          <div className="rounded-xl p-2.5" style={{ background: "#10b98118" }}>
            <DollarSign size={18} style={{ color: "#10b981" }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Approved Total</p>
            <p className="mt-0.5 text-xl font-black text-emerald-600">{loading ? "—" : formatBdt(approvedTotal)}</p>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">

        {/* Search bar */}
        <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, UID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
            />
          </div>
          <button className="admin-secondary-button flex min-h-10 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold">
            <Filter size={15} /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                <th className="p-4 pl-6">User</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Proof</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <Banknote size={36} className="mx-auto mb-3 text-gray-200" />
                        <p className="font-medium text-gray-400">No transactions found</p>
                      </td>
                    </tr>
                  )
                  : filtered.map((p) => {
                    const status = statusConfig(p.status);
                    const isPending = p.status?.toLowerCase() === "pending";
                    return (
                      <tr key={p.id || p._id || `${p.userUid}-${p.createdAt}`} className="transition hover:bg-gray-50/60">
                        <td className="p-4 pl-6">
                          <p className="font-bold text-gray-900 leading-tight">{p.userName || "Unknown User"}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-gray-400">{p.userUid}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-base font-black text-emerald-600">
                            {(Number(p.creditedUsdAmount) || 0) > 0
                              ? formatUsd(p.creditedUsdAmount)
                              : formatBdt(p.amountBdt ?? p.amount)}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {formatBdt(p.amountBdt ?? p.amount)} deposit
                          </p>
                        </td>
                        <td className="p-4 font-medium text-gray-600">{formatPaymentMethod(p.method)}</td>
                        <td className="p-4">
                          <PaymentProofField payment={p} onPreview={setPreviewPayment} />
                        </td>
                        <td className="p-4 text-gray-500">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.cls}`}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.dot }} />
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditPayment(p)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                            >
                              <Pencil size={13} />
                              Edit
                              {(p.editHistoryCount || 0) > 0 ? (
                                <span className="rounded-full bg-sky-200/80 px-1.5 text-[9px] font-black">{p.editHistoryCount}</span>
                              ) : null}
                            </button>
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleAction(p.userUid, "approve")}
                                  className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  <CheckCircle size={13} /> Approve
                                </button>
                                <button
                                  onClick={() => handleAction(p.userUid, "reject")}
                                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                Processed
                              </span>
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
  );
}
