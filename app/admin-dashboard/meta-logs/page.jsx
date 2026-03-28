"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { 
  History, Download, ArrowUpRight, Wallet, 
  Fingerprint, Calendar, Loader2, ChevronLeft, ChevronRight,
  Mail, User, Database, Activity, Search
} from "lucide-react";
import Image from "next/image";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function BudgetLogsPage() {
  const { token } = useFirebaseAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limit = 20;

  const fetchLogs = useCallback(async (page) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ads-request/spending-logs?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
        setTotalLogs(json.total);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (token) fetchLogs(currentPage);
  }, [token, currentPage, fetchLogs]);
  // --- Search Filtering (Front-end) ---
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchLower = search.toLowerCase();
      return (
        log.userName?.toLowerCase().includes(searchLower) ||
        log.userEmail?.toLowerCase().includes(searchLower) ||
        log.ad_account_id?.includes(searchLower)
      );
    });
  }, [logs, search]);

  // --- Download CSV Function (Fixed) ---
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    // CSV Headers
    const headers = ["Date", "User Name", "Email", "Ad Account ID", "Old Limit", "New Limit", "Increased Amount", "Wallet After"];
    
    // Convert logs to CSV rows
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.userName || "N/A",
      log.userEmail || log.user_id,
      `'${log.ad_account_id}`, // Added quote to prevent Excel scientific notation
      log.old_limit,
      log.new_limit,
      log.change_amount,
      log.wallet_after
    ]);

    // Create CSV content
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    
    // Download logic
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Spending_Logs_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 pt-4 md:pt-8 md:p-6 lg:p-8 w-full font-sans">
      <div className="w-full space-y-8">
        
        {/* --- HEADER SECTION (Matches your design) --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Meta Logs History</h1>
            <p className="text-gray-500 mt-1 font-medium">Manage, monitor and export spending logs.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#8ab4ff]" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-[#8ab4ff] focus:outline-none focus:ring-4 focus:ring-[#8ab4ff]/10 sm:w-72"
              />
            </div>

            <button
              onClick={handleExportCSV}
              disabled={loading || filteredLogs.length === 0}
              className="admin-accent-button flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="admin-panel-muted rounded-xl p-3 text-[#8ab4ff]"><Database size={20}/></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Logs Found</p>
                <p className="text-xl font-black text-gray-900">{totalLogs}</p>
              </div>
           </div>
           <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="admin-panel-muted rounded-xl p-3 text-[#8ab4ff]"><Activity size={20}/></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Page</p>
                <p className="text-xl font-black text-gray-900">{currentPage} of {totalPages}</p>
              </div>
           </div>
           <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="admin-panel-muted rounded-xl p-3 text-[#8ab4ff]"><Wallet size={20}/></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Limit</p>
                <p className="text-xl font-black text-gray-900">{limit} Per Page</p>
              </div>
           </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Account ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Change Details</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Wallet Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="5" className="p-20 text-center"><Loader2 className="mx-auto animate-spin text-[#8ab4ff]" /></td></tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="admin-panel-muted relative h-10 w-10 overflow-hidden rounded-xl border">
                          {log.userPhoto ? (
                            <Image src={log.userPhoto} alt="User" fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#8fa5cf]"><User size={16}/></div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{log.userName || "N/A"}</p>
                          <p className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">{log.userEmail || log.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center font-mono text-xs font-bold tracking-tighter text-[#c7d9ff]">
                      {log.ad_account_id}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                          <span className="text-gray-400">${log.old_limit}</span>
                          <ArrowUpRight size={12} className="text-[#8ab4ff]" />
                          <span>${log.new_limit}</span>
                        </div>
                        <span className="mt-1 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-200">
                          +${log.change_amount} INCREASE
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                        <div className="inline-block text-left text-[11px]">
                            <p className="text-gray-400 font-medium">Before: ${log.wallet_before}</p>
                            <p className="font-bold text-gray-900 mt-0.5">After: ${log.wallet_after}</p>
                        </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                        <div className="flex flex-col items-end">
                            <p className="text-xs font-bold text-gray-800">{new Date(log.timestamp).toLocaleDateString('en-GB')}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION --- */}
          <div className="flex flex-col gap-4 border-t border-gray-100 bg-[#101c37] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Showing {filteredLogs.length} of {totalLogs}
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="admin-secondary-button rounded-lg p-2 transition-all disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-[#f5f8ff]">{currentPage}</span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="admin-secondary-button rounded-lg p-2 transition-all disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
