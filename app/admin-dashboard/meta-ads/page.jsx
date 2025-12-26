"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  Search,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCcw
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Swal from "sweetalert2"; // SweetAlert ইম্পোর্ট

/* -------- STATUS UI -------- */
const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
      return {
        bg: "bg-green-100 text-green-700 ring-green-600/20",
        icon: <CheckCircle size={14} className="mr-1" />,
      };
    case "pending":
      return {
        bg: "bg-yellow-100 text-yellow-700 ring-yellow-600/20",
        icon: <Clock size={14} className="mr-1" />,
      };
    case "rejected":
      return {
        bg: "bg-red-100 text-red-700 ring-red-600/20",
        icon: <XCircle size={14} className="mr-1" />,
      };
    default:
      return {
        bg: "bg-gray-100 text-gray-700 ring-gray-500/10",
        icon: <AlertTriangle size={14} className="mr-1" />,
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

  /* -------- UNIVERSAL UPDATE FUNCTION -------- */
  const handleAction = async (id, newStatus) => {
    const MetaAccountID = metaIdMap[id] !== undefined 
      ? metaIdMap[id] 
      : data.find(item => item._id === id)?.MetaAccountID;

    // Validation
    if (newStatus === "active" && (!MetaAccountID || !/^\d+$/.test(MetaAccountID.toString().trim()))) {
      return Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Valid Meta Ad Account ID (only digits) is required!',
      });
    }

    // SweetAlert Confirmation
    const result = await Swal.fire({
      title: `Confirm ${newStatus}?`,
      text: `Do you want to set this request to ${newStatus}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!'
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
          id: id, // নিশ্চিত করুন এই ID টি সঠিক
          status: newStatus, 
          MetaAccountID: MetaAccountID?.toString().trim() || ""
        }),
      });

      const json = await res.json();

      if (res.ok) {
        Swal.fire('Updated!', `Request is now ${newStatus}.`, 'success');
        setMetaIdMap(prev => {
          const newMap = { ...prev };
          delete newMap[id];
          return newMap;
        });
        load(); 
      } else {
        // এরর মেসেজ হ্যান্ডলিং
        Swal.fire('Error', json.message || "Something went wrong", 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Server connection failed', 'error');
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-indigo-600 font-bold">
        <Loader2 className="animate-spin mb-4 w-10 h-10" />
        <p className="animate-pulse">Loading Ad Account Requests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Ad Account Panel</h1>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-black"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-100">
          <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
            <tr>
              <th className="p-4 pl-6 text-left">Details</th>
              <th className="p-4 text-center">BM ID</th>
              <th className="p-4 text-center">Budget</th>
              <th className="p-4 text-center w-[200px]">Meta ID</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((r) => {
              const st = getStatusClasses(r.status);
              return (
                <tr key={r._id} className="hover:bg-slate-50/50 transition duration-150">
                  <td className="p-4 pl-6">
                    <p className="font-bold text-slate-900 truncate">{r.accountName}</p>
                    <p className="text-xs text-slate-500 truncate">{r.userEmail}</p>
                  </td>
                  <td className="p-4 text-center font-mono text-slate-600">{r.bmId || "—"}</td>
                  <td className="p-4 text-center font-black text-slate-900">${r.monthlyBudget}</td>
                  <td className="p-4 text-center">
                    <input
                      className="border border-gray-200 px-3 py-2 rounded-xl w-full max-w-[170px] text-sm font-mono text-black focus:border-indigo-500 outline-none transition-all"
                      placeholder="Meta ID"
                      defaultValue={r.MetaAccountID || ""}
                      onChange={(e) => setMetaIdMap({ ...metaIdMap, [r._id]: e.target.value.trim() })}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ${st.bg}`}>
                      {st.icon} {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleAction(r._id, "active")} className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-100 transition-all">
                        <CheckCircle size={18} />
                      </button>
                      <button onClick={() => handleAction(r._id, "rejected")} className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-all">
                        <XCircle size={18} />
                      </button>
                      <button onClick={() => handleAction(r._id, "pending")} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-600 hover:text-white border border-slate-200 transition-all">
                        <RefreshCcw size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}