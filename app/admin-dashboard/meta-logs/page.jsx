"use client";

import { useEffect, useState, useMemo } from "react";
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

  useEffect(() => {
    if (token) fetchLogs(currentPage);
  }, [token, currentPage]);

  const fetchLogs = async (page) => {
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
  };

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
    <div className="min-h-screen bg-[#f8f9fa] p-4 pt-20 md:p-8 w-full font-sans">
      <div className="w-full space-y-8">
        
        {/* --- HEADER SECTION (Matches your design) --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Meta Logs History</h1>
            <p className="text-gray-500 mt-1 font-medium">Manage, monitor and export spending logs.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10 pr-4 py-2.5 w-full sm:w-72 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all shadow-sm"
              />
            </div>

            <button
              onClick={handleExportCSV}
              disabled={loading || filteredLogs.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-gray-100 text-black rounded-xl"><Database size={20}/></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Logs Found</p>
                <p className="text-xl font-black text-gray-900">{totalLogs}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-gray-100 text-black rounded-xl"><Activity size={20}/></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Page</p>
                <p className="text-xl font-black text-gray-900">{currentPage} of {totalPages}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-gray-100 text-black rounded-xl"><Wallet size={20}/></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Limit</p>
                <p className="text-xl font-black text-gray-900">{limit} Per Page</p>
              </div>
           </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
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
                  <tr><td colSpan="5" className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-black" /></td></tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                          {log.userPhoto ? (
                            <Image src={log.userPhoto} alt="User" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={16}/></div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{log.userName || "N/A"}</p>
                          <p className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">{log.userEmail || log.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center font-mono text-xs font-bold text-gray-600 tracking-tighter">
                      {log.ad_account_id}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                          <span className="text-gray-400">${log.old_limit}</span>
                          <ArrowUpRight size={12} className="text-emerald-500" />
                          <span>${log.new_limit}</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
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
          <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Showing {filteredLogs.length} of {totalLogs}
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold w-8 text-center">{currentPage}</span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all"
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