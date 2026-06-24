"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  CreditCard,
  History,
  TrendingUp,
  Loader2
} from "lucide-react";
import { useApiQuery, useInvalidateApi } from "@/hooks/useApiQuery";
import { queryKeys } from "@/lib/queryKeys";
import useAppAuth from "@/hooks/useAppAuth";
import Swal from "sweetalert2";

// --- STATUS UI HELPER ---
const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-100";
    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/20 border-amber-100";
    case "rejected":
      return "bg-red-50 text-red-700 ring-red-600/20 border-red-100";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-500/10 border-slate-100";
  }
};

export default function AffiliatePayoutsPage() {
  const { token } = useAppAuth();
  const invalidate = useInvalidateApi();

  const { data: requests = [], isLoading: initialLoading, refetch: loadRequests } = useApiQuery(
    queryKeys.admin.affiliates(),
    "/api/admin/affiliate/list",
    { select: (json) => json.requests || json.data || [] }
  );

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // --- EXPORT CSV FUNCTION ---
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) return;
    
    const headers = ["Name,Email,Amount,Method,Account Info,Status,Date\n"];
    const rows = filteredRequests.map(r => 
      `${r.userName},${r.userEmail},${r.amount},${r.method},${r.account?.number || 'N/A'},${r.status},${new Date(r.createdAt).toLocaleDateString()}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Payout_Requests_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  // --- ACTION HANDLER ---
  const handleAction = async (requestId, action) => {
    const actionText = action === "approve" ? "approve" : "reject";
    
    const result = await Swal.fire({
      title: `Confirm ${actionText}?`,
      text: `Are you sure you want to ${actionText} this withdrawal request?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${actionText} it!`
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliate/approve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, action }),
      });

      if (res.ok) {
        Swal.fire('Success', `Request has been ${actionText}d.`, 'success');
        loadRequests();
        invalidate(queryKeys.admin.affiliates());
      } else {
        const json = await res.json();
        Swal.fire('Error', json.message || "Failed to process request", 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Network error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERED REQUESTS ---
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const requestStatus = r.status?.toLowerCase() || '';
      const statusMatch = filter === "All" || requestStatus === filter.toLowerCase();
      const searchLower = search.toLowerCase();
      const searchMatch = (r.userName?.toLowerCase() || '').includes(searchLower) || 
                          (r.userEmail?.toLowerCase() || '').includes(searchLower);
      return statusMatch && searchMatch;
    });
  }, [requests, filter, search]);

  // --- STATS ---
  const totalPaid = useMemo(() => requests.filter(r => r.status?.toLowerCase() === "approved").reduce((sum, r) => sum + (r.amount || 0), 0), [requests]);
  const pendingCount = useMemo(() => requests.filter(r => r.status?.toLowerCase() === "pending").length, [requests]);

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin mb-4 w-10 h-10 text-black" />
        <p className="text-gray-500 font-medium animate-pulse">Loading payout records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Affiliate Payouts</h1>
          <p className="mt-0.5 text-sm text-gray-500">Review and process affiliate withdrawal requests in real-time.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredRequests.length === 0}
          className="admin-accent-button flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4" style={{ borderLeft: "3px solid #10b981" }}>
          <div className="rounded-xl p-2.5" style={{ background: "#10b98118" }}>
            <TrendingUp size={18} style={{ color: "#10b981" }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Total Paid Out</p>
            <p className="mt-0.5 text-xl font-black text-gray-900">${totalPaid.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4" style={{ borderLeft: "3px solid #f59e0b" }}>
          <div className="rounded-xl p-2.5" style={{ background: "#f59e0b18" }}>
            <History size={18} style={{ color: "#f59e0b" }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Pending Requests</p>
            <p className="mt-0.5 text-xl font-black text-gray-900">{pendingCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4" style={{ borderLeft: "3px solid #3b82f6" }}>
          <div className="rounded-xl p-2.5" style={{ background: "#3b82f618" }}>
            <CreditCard size={18} style={{ color: "#3b82f6" }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Total Requests</p>
            <p className="mt-0.5 text-xl font-black text-gray-900">{requests.length}</p>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* FILTERS */}
        <div className="flex flex-col items-stretch justify-between gap-4 border-b border-gray-50 p-5 md:flex-row md:items-center">
            <div className="group relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
                <input
                    type="text"
                    placeholder="Search by affiliate name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                />
            </div>

            <div className="flex w-full items-center gap-3 md:w-auto">
                <Filter size={18} className="text-gray-400" />
                <select
                    className="flex-1 md:w-48 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:ring-4 focus:ring-black/5"
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest">Affiliate User</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-center">Payment Info</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-center">Date</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filteredRequests.map((req) => (
                <tr key={req._id} className="group hover:bg-gray-50/80 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="admin-panel-muted flex h-10 w-10 items-center justify-center rounded-full font-bold text-[#dce8ff]">
                            {req.userName?.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 leading-tight">{req.userName}</p>
                            <p className="text-[11px] text-gray-400 font-medium">{req.userEmail}</p>
                        </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-black text-gray-900">${req.amount?.toLocaleString()}</td>
                  
                  <td className="px-6 py-4 text-center">
                    <p className="text-xs font-bold uppercase text-[#dce8ff]">{req.method}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{req.account?.number || 'N/A'}</p>
                  </td>

                  <td className="px-6 py-4 text-center text-xs text-gray-500 font-medium">
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight border ${getStatusClasses(req.status)}`}>
                      {req.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    {req.status?.toLowerCase() === "pending" ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleAction(req._id, "approve")}
                          disabled={loading}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleAction(req._id, "reject")}
                          disabled={loading}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 font-bold uppercase tracking-tighter">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-400 font-medium">No withdrawal requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
