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
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

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
  const [loading, setLoading] = useState(false); // Global action loading state
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [metaIdMap, setMetaIdMap] = useState({});

  /* -------- LOAD DATA -------- */
  const load = async () => {
    setInitialLoading(true);
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

  /* -------- APPROVE -------- */
  const approve = async (id) => {
    const MetaAccountID = metaIdMap[id];
    
    // Ensure Meta ID is provided and is a valid format (e.g., purely digits, often 15-18 digits)
    if (!MetaAccountID || MetaAccountID.trim() === "" || !/^\d+$/.test(MetaAccountID.trim())) {
      return alert("Valid Meta Ad Account ID (only digits) is required for approval.");
    }

    if (!confirm("Approve this ad account request?")) return;

    setLoading(true);
    try {
        const res = await fetch("/api/admin/ads-request/approve", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, status: "active", MetaAccountID: MetaAccountID.trim() }),
        });
        if (res.ok) {
            // Clear the specific input field on success
             setMetaIdMap(prev => { 
                const newMap = {...prev};
                delete newMap[id];
                return newMap;
            });
            alert("Request approved successfully.");
        } else {
             const json = await res.json();
             alert(`Approval failed: ${json.error || "Unknown error"}`);
        }
    } catch (error) {
        alert("An unexpected error occurred during approval.");
    } finally {
        setLoading(false);
        load();
    }
  };

  /* -------- REJECT -------- */
  const reject = async (id) => {
    if (!confirm("Reject this ad account request?")) return;

    setLoading(true);
    try {
        const res = await fetch("/api/admin/ads-request/approve", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, status: "rejected" }),
        });
        if (!res.ok) {
             const json = await res.json();
             alert(`Rejection failed: ${json.error || "Unknown error"}`);
        } else {
            alert("Request rejected successfully.");
        }
    } catch (error) {
        alert("An unexpected error occurred during rejection.");
    } finally {
        setLoading(false);
        load();
    }
  };

  /* -------- FILTER -------- */
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter(
      (d) =>
        d.accountName?.toLowerCase().includes(s) ||
        d.userEmail?.toLowerCase().includes(s)
    );
  }, [data, search]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-lg text-blue-600">
        <Loader2 className="animate-spin mr-2 w-6 h-6" />
        Loading Ad Account Requests...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ================= HEADER & SEARCH ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Ad Account Approval Panel
        </h1>
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-100">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-4 pl-6 text-left font-semibold w-[200px]">Account Details</th>
              <th className="p-4 text-center font-semibold">BM ID</th>
              <th className="p-4 text-center font-semibold">Budget</th>
              <th className="p-4 text-center font-semibold">Timezone</th>
              <th className="p-4 text-center font-semibold">Start Date</th>
              <th className="p-4 text-center font-semibold">Facebook Page</th>
              <th className="p-4 text-center font-semibold w-[180px]">Meta Ad Account ID</th> {/* Increased width */}
              <th className="p-4 text-center font-semibold">Status</th>
              <th className="p-4 text-right pr-6 font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => {
              const isPending = r.status === "pending";
              const st = getStatusClasses(r.status);

              return (
                <tr key={r._id} className="hover:bg-gray-50 transition duration-100">
                  
                  {/* Account Details */}
                  <td className="p-4 pl-6">
                    <p className="font-semibold text-gray-900 truncate">{r.accountName || "N/A"}</p>
                    <p className="text-xs text-gray-500 truncate">{r.userEmail || "N/A"}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Req: {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </td>

                  {/* BM ID */}
                  <td className="p-4 text-center font-mono text-gray-700">{r.bmId || "—"}</td>
                  
                  {/* Monthly Budget */}
                  <td className="p-4 text-center font-bold text-gray-900">
                    ${r.monthlyBudget?.toLocaleString('en-US') || "0"}
                  </td>
                  
                  {/* Timezone */}
                  <td className="p-4 text-center text-gray-600">{r.timezone || "—"}</td>
                  
                  {/* Start Date */}
                  <td className="p-4 text-center text-gray-600">{r.startDate || "—"}</td>

                  {/* Facebook Page Link */}
                  <td className="p-4 text-center">
                    {r.facebookPage ? (
                      <a
                        href={r.facebookPage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition inline-flex items-center gap-1 font-medium"
                      >
                        View <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Meta Ad Account ID Input/Display (Wider Field) */}
                  <td className="p-4 text-center">
                    {isPending ? (
                      <input
                        className="border border-gray-300 px-3 py-1.5 rounded-lg w-[160px] text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
                        placeholder="16-Digit Meta ID"
                        value={metaIdMap[r._id] || ""}
                        onChange={(e) =>
                          setMetaIdMap({
                            ...metaIdMap,
                            [r._id]: e.target.value.trim(), // Trim whitespace
                          })
                        }
                      />
                    ) : (
                      <span className="font-mono text-gray-700 break-all w-[160px] inline-block">
                        {r.MetaAccountID || "—"}
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${st.bg}`}
                    >
                      {st.icon}
                      {r.status?.charAt(0).toUpperCase() + r.status?.slice(1)}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="p-4 text-right pr-6">
                    {isPending ? (
                      <div className="flex justify-end gap-2">
                        {/* Approve Button */}
                        <button
                          title="Approve Request"
                          disabled={loading || !metaIdMap[r._id]}
                          onClick={() => approve(r._id)}
                          className={`p-2 rounded-full transition duration-150 ${
                            loading || !metaIdMap[r._id]
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-green-50 text-green-600 hover:bg-green-100 ring-1 ring-green-300"
                          }`}
                        >
                          <CheckCircle size={18} />
                        </button>
                        
                        {/* Reject Button */}
                        <button
                          title="Reject Request"
                          disabled={loading}
                          onClick={() => reject(r._id)}
                          className={`p-2 rounded-full transition duration-150 ${
                            loading
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-300"
                          }`}
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {r.status === "active" ? "Approved" : "Reviewed"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="p-8 text-center bg-gray-50">
            <p className="text-base font-medium text-gray-600">
              No ad account requests found.
            </p>
            <p className="text-sm text-gray-400 mt-1">
                Requests will appear here when users submit their BM IDs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}