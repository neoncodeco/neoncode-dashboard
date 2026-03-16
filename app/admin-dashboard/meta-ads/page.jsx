"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
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
        bg: "bg-emerald-400/10 text-emerald-200 ring-emerald-400/20 border-emerald-400/20",
        icon: <CheckCircle size={14} className="mr-1.5" />,
      };
    case "pending":
      return {
        bg: "bg-amber-400/10 text-amber-200 ring-amber-400/20 border-amber-400/20",
        icon: <Clock size={14} className="mr-1.5" />,
      };
    case "rejected":
      return {
        bg: "bg-red-400/10 text-red-200 ring-red-400/20 border-red-400/20",
        icon: <XCircle size={14} className="mr-1.5" />,
      };
    case "cancelled":
      return {
        bg: "bg-slate-400/10 text-slate-200 ring-slate-400/20 border-slate-400/20",
        icon: <XCircle size={14} className="mr-1.5" />,
      };
    default:
      return {
        bg: "bg-slate-400/10 text-slate-200 ring-slate-400/20 border-slate-400/20",
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
  const [editMap, setEditMap] = useState({});
  const [showManualAdd, setShowManualAdd] = useState(true);
  const [newAccount, setNewAccount] = useState({
    accountName: "",
    bmId: "",
    monthlyBudget: 0,
    userUid: "",
    userEmail: "",
    MetaAccountID: "",
    status: "active",
  });

  const load = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const getRowValue = (row, key) => {
    const override = editMap[row._id];
    if (override && override[key] !== undefined) return override[key];
    return row[key];
  };

  const handleAction = async (id, newStatus) => {
    const row = data.find(item => item._id === id);
    const MetaAccountID = getRowValue(row || {}, "MetaAccountID");

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
          id,
          status: newStatus, 
          MetaAccountID: MetaAccountID?.toString().trim() || ""
        }),
      });

      if (res.ok) {
        Swal.fire('Updated!', `Status changed to ${newStatus}`, 'success');
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

  const onRowFieldChange = (id, key, value) => {
    setEditMap((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [key]: value,
      },
    }));
  };

  const saveRow = async (row) => {
    const payload = {
      id: row._id,
      accountName: getRowValue(row, "accountName") || "",
      bmId: getRowValue(row, "bmId") || "",
      monthlyBudget: Number(getRowValue(row, "monthlyBudget") || 0),
      userUid: getRowValue(row, "userUid") || "",
      userEmail: getRowValue(row, "userEmail") || "",
      MetaAccountID: getRowValue(row, "MetaAccountID") || "",
      status: getRowValue(row, "status") || "pending",
    };

    const res = await fetch("/api/admin/ads-request/approve", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      return Swal.fire("Error", json.message || "Save failed", "error");
    }
    Swal.fire("Saved", "Account updated", "success");
    setEditMap((prev) => {
      const next = { ...prev };
      delete next[row._id];
      return next;
    });
    load();
  };

  const cancelRow = async (row) => {
    const res = await fetch("/api/admin/ads-request/approve", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: row._id }),
    });
    const json = await res.json();
    if (!res.ok) {
      return Swal.fire("Error", json.message || "Cancel failed", "error");
    }
    Swal.fire("Done", "Ad account cancelled", "success");
    load();
  };

  const addManualAccount = async () => {
    if (!newAccount.accountName || !newAccount.bmId) {
      return Swal.fire("Missing", "Account Name + BM ID required", "warning");
    }
    const res = await fetch("/api/admin/ads-request/approve", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...newAccount,
        monthlyBudget: Number(newAccount.monthlyBudget || 0),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      return Swal.fire("Error", json.message || "Add failed", "error");
    }
    Swal.fire("Added", "Manual ad account added", "success");
    setNewAccount({
      accountName: "",
      bmId: "",
      monthlyBudget: 0,
      userUid: "",
      userEmail: "",
      MetaAccountID: "",
      status: "active",
    });
    load();
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
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#8ab4ff]" />
        <p className="text-gray-500 font-medium animate-pulse">Fetching ad requests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#fcfcfc] p-4 pt-20 sm:p-6 sm:pt-20 md:space-y-8 md:p-8 md:pt-8">
      
      {/* HEADER SECTION */}
      <div className="overflow-hidden rounded-[2rem] border border-[#22375d] bg-[linear-gradient(135deg,rgba(19,37,70,0.96),rgba(11,24,48,0.96))] p-5 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#8ab4ff]/20 bg-[#8ab4ff]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfe0ff]">
              <Layers size={12} />
              Meta Ads Workspace
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#f5f8ff] sm:text-3xl">Ad Account Panel</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-[#9fb3de]">
              Review, activate, and manage business ad account requests from one control surface.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="group relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7f96c7] transition-colors group-focus-within:text-[#8ab4ff]" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search account or email..."
                className="w-full rounded-xl border border-[#2c4167] bg-[#132546] py-2.5 pl-10 pr-4 text-sm text-[#f5f8ff] shadow-sm transition-all focus:border-[#8ab4ff] focus:outline-none focus:ring-4 focus:ring-[#8ab4ff]/10 sm:w-72"
              />
            </div>
            
            <button 
              onClick={load}
              className="admin-secondary-button flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/5">
        <div className="p-4 border-b border-gray-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-black text-gray-800">Manual Ad Account Add (Admin)</h3>
            <button
              onClick={() => setShowManualAdd((v) => !v)}
              className="admin-accent-button rounded-lg px-3 py-1.5 text-xs font-bold"
            >
              {showManualAdd ? "Hide Add Form" : "Show Add Form"}
            </button>
          </div>
          {showManualAdd && (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-7">
              <input placeholder="Account Name" value={newAccount.accountName} onChange={(e) => setNewAccount((p) => ({ ...p, accountName: e.target.value }))} className="border rounded-lg px-3 py-2 text-xs bg-white" />
              <input placeholder="BM ID" value={newAccount.bmId} onChange={(e) => setNewAccount((p) => ({ ...p, bmId: e.target.value }))} className="border rounded-lg px-3 py-2 text-xs bg-white" />
              <input placeholder="Budget" type="number" value={newAccount.monthlyBudget} onChange={(e) => setNewAccount((p) => ({ ...p, monthlyBudget: e.target.value }))} className="border rounded-lg px-3 py-2 text-xs bg-white" />
              <input placeholder="User UID" value={newAccount.userUid} onChange={(e) => setNewAccount((p) => ({ ...p, userUid: e.target.value }))} className="border rounded-lg px-3 py-2 text-xs bg-white" />
              <input placeholder="User Email" value={newAccount.userEmail} onChange={(e) => setNewAccount((p) => ({ ...p, userEmail: e.target.value }))} className="border rounded-lg px-3 py-2 text-xs bg-white" />
              <input placeholder="Meta ID" value={newAccount.MetaAccountID} onChange={(e) => setNewAccount((p) => ({ ...p, MetaAccountID: e.target.value }))} className="border rounded-lg px-3 py-2 text-xs bg-white" />
              <button onClick={addManualAccount} className="admin-accent-button rounded-lg px-3 py-2 text-xs font-bold">
                + Add Manual
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
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
                    <tr key={r._id} className="group transition-all hover:bg-[#132546]/50">
                      {/* DETAILS */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="admin-panel-muted rounded-xl p-2.5 text-[#8ab4ff]">
                            <Layers size={18} />
                          </div>
                          <div>
                            <input
                              className="font-bold text-gray-900 leading-tight border rounded px-2 py-1 text-xs w-44"
                              value={getRowValue(r, "accountName") || ""}
                              onChange={(e) => onRowFieldChange(r._id, "accountName", e.target.value)}
                            />
                            <input
                              className="text-[11px] text-gray-500 font-medium mt-1 border rounded px-2 py-1 w-44"
                              value={getRowValue(r, "userEmail") || ""}
                              onChange={(e) => onRowFieldChange(r._id, "userEmail", e.target.value)}
                            />
                          </div>
                        </div>
                      </td>

                      {/* BM ID */}
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono text-xs bg-[#132546] px-2 py-1 rounded text-[#c7d9ff] border border-[#22375d]">
                          <input
                            className="w-36 rounded border border-gray-200 bg-white px-2 py-1 text-center font-mono text-xs text-gray-600"
                            value={getRowValue(r, "bmId") || ""}
                            onChange={(e) => onRowFieldChange(r._id, "bmId", e.target.value)}
                          />
                        </span>
                      </td>

                      {/* BUDGET */}
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          className="text-sm font-black text-gray-800 border border-gray-200 rounded px-2 py-1 text-center w-24"
                          value={getRowValue(r, "monthlyBudget") || 0}
                          onChange={(e) => onRowFieldChange(r._id, "monthlyBudget", e.target.value)}
                        />
                      </td>

                      {/* META ID INPUT */}
                      <td className="px-6 py-4 text-center">
                        <input
                          className="border border-gray-200 px-3 py-1.5 rounded-lg w-full max-w-[150px] text-xs font-mono focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all text-center"
                          placeholder="Enter ID"
                          value={getRowValue(r, "MetaAccountID") || ""}
                          onChange={(e) => onRowFieldChange(r._id, "MetaAccountID", e.target.value.trim())}
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
                            onClick={() => saveRow(r)}
                            title="Save Row"
                            className="rounded-lg border border-[#8ab4ff]/20 bg-[#8ab4ff]/10 p-2 text-[#cfe0ff] transition-all hover:bg-[#8ab4ff] hover:text-[#081227]"
                          >
                            <ExternalLink size={16} />
                          </button>

                          <button 
                            onClick={() => handleAction(r._id, "active")} 
                            title="Approve"
                            className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-200 transition-all hover:bg-emerald-500 hover:text-white"
                          >
                            <CheckCircle size={16} />
                          </button>
                          
                          <button 
                            onClick={() => handleAction(r._id, "rejected")} 
                            title="Reject"
                            className="rounded-lg border border-red-400/20 bg-red-400/10 p-2 text-red-200 transition-all hover:bg-red-500 hover:text-white"
                          >
                            <XCircle size={16} />
                          </button>

                          <button 
                            onClick={() => cancelRow(r)} 
                            title="Cancel account"
                            className="rounded-lg border border-slate-400/20 bg-slate-400/10 p-2 text-slate-200 transition-all hover:bg-slate-500 hover:text-white"
                          >
                            <XCircle size={16} />
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
