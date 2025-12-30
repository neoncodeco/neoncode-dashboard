"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  Search,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Layers,
  ExternalLink
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Swal from "sweetalert2";

/* -------- STATUS UI CONFIG -------- */
const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
      return {
        bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-100",
        icon: <CheckCircle size={14} className="mr-1.5" />,
      };
    case "pending":
      return {
        bg: "bg-amber-50 text-amber-700 ring-amber-600/20 border-amber-100",
        icon: <Clock size={14} className="mr-1.5" />,
      };
    case "rejected":
      return {
        bg: "bg-red-50 text-red-700 ring-red-600/20 border-red-100",
        icon: <XCircle size={14} className="mr-1.5" />,
      };
    default:
      return {
        bg: "bg-slate-50 text-slate-700 ring-slate-500/10 border-slate-100",
        icon: <AlertTriangle size={14} className="mr-1.5" />,
      };
  }
};

export default function AdminAdAccountApprove() {
  const { token } = useFirebaseAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [metaIdMap, setMetaIdMap] = useState({});

  const load = async () => {
    try {
      const res = await fetch("/api/admin/ads-request/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setData(json.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const handleAction = async (id, newStatus) => {
    const MetaAccountID = metaIdMap[id] !== undefined 
      ? metaIdMap[id] 
      : data.find(item => item._id === id)?.MetaAccountID;

    if (newStatus === "active" && (!MetaAccountID || !/^\d+$/.test(MetaAccountID.toString().trim()))) {
      return Swal.fire({
        icon: 'error',
        title: 'ID Missing',
        text: 'A valid Meta Ad Account ID is required for activation!',
      });
    }

    const result = await Swal.fire({
      title: `Update to ${newStatus}?`,
      text: "Are you sure you want to change this request status?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#000',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Proceed'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads-request/approve", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          id: id, 
          status: newStatus, 
          MetaAccountID: MetaAccountID?.toString().trim() || ""
        }),
      });

      if (res.ok) {
        Swal.fire('Updated!', `Status changed to ${newStatus}`, 'success');
        setMetaIdMap(prev => {
          const newMap = { ...prev };
          delete newMap[id];
          return newMap;
        });
        load(); 
      } else {
        const json = await res.json();
        Swal.fire('Error', json.message || "Action failed", 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(
      (d) =>
        d.accountName?.toLowerCase().includes(s) ||
        d.userEmail?.toLowerCase().includes(s) ||
        d.bmId?.includes(s)
    );
  }, [data, search]);

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin mb-4 w-10 h-10 text-black" />
        <p className="text-gray-500 font-medium animate-pulse">Fetching ad requests...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#fcfcfc] min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Ad Account Panel</h1>
          <p className="text-gray-500 mt-1">Review and approve business ad account requests.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account or email..."
              className="pl-10 pr-4 py-2.5 w-full sm:w-72 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all shadow-sm"
            />
          </div>
          
          <button 
            onClick={load}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest">Account Details</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-center">BM ID</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-center">Budget</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-center">Meta ID Input</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">
                    No ad account requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const st = getStatusClasses(r.status);
                  return (
                    <tr key={r._id} className="group hover:bg-gray-50/80 transition-all">
                      {/* DETAILS */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Layers size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">{r.accountName}</p>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{r.userEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* BM ID */}
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {r.bmId || "N/A"}
                        </span>
                      </td>

                      {/* BUDGET */}
                      <td className="px-6 py-4 text-center">
                        <p className="text-sm font-black text-gray-800">${r.monthlyBudget}</p>
                      </td>

                      {/* META ID INPUT */}
                      <td className="px-6 py-4 text-center">
                        <input
                          className="border border-gray-200 px-3 py-1.5 rounded-lg w-full max-w-[150px] text-xs font-mono focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all text-center"
                          placeholder="Enter ID"
                          defaultValue={r.MetaAccountID || ""}
                          onChange={(e) => setMetaIdMap({ ...metaIdMap, [r._id]: e.target.value.trim() })}
                        />
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight border ${st.bg}`}>
                          {st.icon} {r.status || "Pending"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleAction(r._id, "active")} 
                            title="Approve"
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                          >
                            <CheckCircle size={16} />
                          </button>
                          
                          <button 
                            onClick={() => handleAction(r._id, "rejected")} 
                            title="Reject"
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                          >
                            <XCircle size={16} />
                          </button>

                          <button 
                            onClick={() => handleAction(r._id, "pending")} 
                            title="Reset to Pending"
                            className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-black hover:text-white transition-all border border-gray-200"
                          >
                            <RefreshCcw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}