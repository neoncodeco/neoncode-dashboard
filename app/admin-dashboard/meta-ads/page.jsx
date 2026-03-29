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
  ExternalLink,
  ShieldAlert,
  Building2,
  Check,
  Save,
  Trash2
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Swal from "sweetalert2";

/* -------- STATUS UI CONFIG (Original Design Intact) -------- */
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
    case "blocked":
      return {
        bg: "bg-red-600/20 text-red-400 ring-red-500/20 border-red-500/20",
        icon: <ShieldAlert size={14} className="mr-1.5" />,
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
  const [bmConfigs, setBmConfigs] = useState([]); 
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

  // ১. ডাটা লোড ফাংশন (সেটিংস এবং রিকোয়েস্ট লিস্ট সহ)
  const load = useCallback(async () => {
    try {
      const [listRes, settingsRes] = await Promise.all([
        fetch("/api/admin/ads-request/list", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const listJson = await listRes.json();
      const settingsJson = await settingsRes.json();

      if (listRes.ok) setData(listJson.data || []);
      if (settingsJson.bmConfigs) setBmConfigs(settingsJson.bmConfigs);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setInitialLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  // ২. স্মার্ট সাজেশন লজিক
  const getSuggestedBM = (metaId) => {
    if (!metaId) return null;
    for (const bm of bmConfigs) {
      const found = bm.slots?.find(s => s.metaId?.trim() === metaId.trim());
      if (found) return bm;
    }
    return null;
  };

  const getRowValue = (row, key) => {
    const override = editMap[row._id];
    if (override && override[key] !== undefined) return override[key];
    return row[key];
  };

  const handleAction = async (id, newStatus) => {
    const row = data.find(item => item._id === id);
    const MetaAccountID = getRowValue(row || {}, "MetaAccountID");

    if (newStatus === "active" && (!MetaAccountID)) {
      return Swal.fire({ icon: 'error', title: 'ID Missing', text: 'Meta ID is required!' });
    }

    const result = await Swal.fire({
      title: `Confirm ${newStatus}?`,
      text: "Are you sure?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'blocked' ? '#d33' : '#000',
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads-request/approve", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, MetaAccountID: MetaAccountID?.toString().trim() || "" }),
      });
      if (res.ok) { load(); Swal.fire('Success', '', 'success'); }
    } finally { setLoading(false); }
  };

  const onRowFieldChange = (id, key, value) => {
    setEditMap((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: value } }));
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
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { load(); Swal.fire("Saved", "", "success"); }
  };

  const cancelRow = async (row) => {
    const res = await fetch("/api/admin/ads-request/approve", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: row._id }),
    });
    if (res.ok) { load(); }
  };

  const addManualAccount = async () => {
    if (!newAccount.accountName || !newAccount.bmId) return Swal.fire("Missing Info");
    const res = await fetch("/api/admin/ads-request/approve", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAccount, monthlyBudget: Number(newAccount.monthlyBudget || 0) }),
    });
    if (res.ok) { load(); }
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter((d) => d.accountName?.toLowerCase().includes(s) || d.userEmail?.toLowerCase().includes(s) || d.bmId?.includes(s));
  }, [data, search]);

  if (initialLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[500px]">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#8ab4ff]" />
      <p className="text-gray-500 font-medium animate-pulse">Organizing Workspace...</p>
    </div>
  );

  return (
    <div className="min-h-screen space-y-6 bg-[#fcfcfc] p-4 sm:p-6 md:space-y-8 md:p-8">
      
      {/* HEADER SECTION (Original) */}
      <div className="overflow-hidden rounded-[2rem] border border-[#22375d] bg-[linear-gradient(135deg,rgba(19,37,70,0.96),rgba(11,24,48,0.96))] p-5 shadow-xl sm:p-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#8ab4ff]/20 bg-[#8ab4ff]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#cfe0ff]">
              <Layers size={12} /> Meta Ads Workspace
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#f5f8ff] sm:text-3xl">Ad Account Panel</h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-[#9fb3de]">Review and manage requests with smart mapping.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="group relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7f96c7]" size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records..." className="w-full rounded-xl border border-[#2c4167] bg-[#132546] py-2.5 pl-10 pr-4 text-sm text-[#f5f8ff] focus:outline-none sm:w-72" />
            </div>
            <button onClick={load} className="admin-secondary-button flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold active:scale-95"><RefreshCcw size={16} /> Refresh</button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* MANUAL ADD FORM */}
        <div className="p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-base font-black text-gray-800 uppercase sm:text-lg">Manual Entry</h3>
            <button onClick={() => setShowManualAdd(!showManualAdd)} className="admin-accent-button rounded-lg px-4 py-2 text-sm font-bold">{showManualAdd ? "Hide Form" : "Show Form"}</button>
          </div>
          {showManualAdd && (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-7">
              <input placeholder="Account Name" value={newAccount.accountName} onChange={(e) => setNewAccount((p) => ({ ...p, accountName: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none" />
              <input placeholder="BM ID" value={newAccount.bmId} onChange={(e) => setNewAccount((p) => ({ ...p, bmId: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none" />
              <input placeholder="Budget" type="number" value={newAccount.monthlyBudget} onChange={(e) => setNewAccount((p) => ({ ...p, monthlyBudget: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none" />
              <input placeholder="User UID" value={newAccount.userUid} onChange={(e) => setNewAccount((p) => ({ ...p, userUid: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none" />
              <input placeholder="User Email" value={newAccount.userEmail} onChange={(e) => setNewAccount((p) => ({ ...p, userEmail: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none" />
              <input placeholder="Meta ID" value={newAccount.MetaAccountID} onChange={(e) => setNewAccount((p) => ({ ...p, MetaAccountID: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none" />
              <button onClick={addManualAccount} className="admin-accent-button rounded-lg px-4 py-3 text-sm font-bold">+ Add Manual</button>
            </div>
          )}
        </div>

        {/* MOBILE VIEW */}
        <div className="space-y-3 p-3 md:hidden">
          {filtered.map((r) => {
            const st = getStatusClasses(r.status);
            const suggested = getSuggestedBM(getRowValue(r, "MetaAccountID"));
            return (
              <div key={r._id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
                <div className="flex gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600"><Layers size={18} /></div>
                  <div className="flex-1">
                    <input className="w-full truncate border-b text-base font-bold text-gray-900 outline-none focus:border-blue-500" value={getRowValue(r, "accountName")} onChange={(e) => onRowFieldChange(r._id, "accountName", e.target.value)} />
                    <p className="mt-1 text-xs font-bold text-gray-400">{getRowValue(r, "userEmail")}</p>
                  </div>
                </div>
                <div className="relative">
                  <input className="w-full border rounded-lg p-2 text-xs font-mono" placeholder="Meta ID" value={getRowValue(r, "MetaAccountID") || ""} onChange={(e) => onRowFieldChange(r._id, "MetaAccountID", e.target.value)} />
                  {suggested && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="text-[9px] text-emerald-700 font-bold uppercase"><Building2 size={12}/> suggest: {suggested.bmName}</p>
                      <button onClick={() => handleAction(r._id, "active")} className="mt-1 text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded font-black">CONNECT</button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${st.bg}`}>{r.status}</span>
                  <div className="flex gap-2">
                    <button onClick={() => saveRow(r)} className="p-2 bg-blue-50 rounded-lg text-blue-600"><Save size={14}/></button>
                    <button onClick={() => handleAction(r._id, "active")} className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle size={14}/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP TABLE VIEW (Full Detailed) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-gray-100 text-xs font-black uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-6 py-5">Account & User Details</th>
                <th className="px-6 py-5 text-center">BM Assignment</th>
                <th className="px-6 py-5 text-center">Meta ID & Smart Link</th>
                <th className="px-6 py-5 text-center">Budget</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => {
                const st = getStatusClasses(r.status);
                const currentMetaId = getRowValue(r, "MetaAccountID");
                const suggested = getSuggestedBM(currentMetaId);

                return (
                  <tr key={r._id} className="group hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="admin-panel-muted rounded-xl p-2.5 text-[#8ab4ff]"><Layers size={18}/></div>
                        <div>
                          <input className="w-44 border-none bg-transparent text-lg font-bold text-gray-900 outline-none" value={getRowValue(r, "accountName")} onChange={(e) => onRowFieldChange(r._id, "accountName", e.target.value)} />
                          <p className="mt-1 text-xs font-bold text-gray-400">{getRowValue(r, "userEmail")}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                       <input className="w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center font-mono text-sm font-bold text-slate-600 outline-none shadow-sm" value={getRowValue(r, "bmId")} onChange={(e) => onRowFieldChange(r._id, "bmId", e.target.value)} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center space-y-2">
                        <input className="w-52 rounded-lg border border-gray-200 px-4 py-2 text-sm font-mono text-center outline-none shadow-inner focus:border-blue-500" placeholder="Paste Meta ID" value={currentMetaId || ""} onChange={(e) => onRowFieldChange(r._id, "MetaAccountID", e.target.value)} />
                        {suggested && (
                          <div className="animate-in fade-in slide-in-from-top-1 bg-emerald-50 border border-emerald-100 p-2 rounded-xl flex items-center gap-3 shadow-sm">
                             <div className="flex items-center gap-1.5 text-emerald-700">
                                <Building2 size={12} />
                                <span className="text-[11px] font-black uppercase">Slot: {suggested.bmName}</span>
                             </div>
                             <button onClick={() => handleAction(r._id, "active")} className="rounded bg-emerald-600 px-3 py-1.5 text-[11px] font-bold uppercase text-white transition-all hover:bg-emerald-700">Connect</button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                       <div className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 px-3">
                         <span className="text-sm text-gray-400">$</span>
                         <input type="number" className="w-20 bg-transparent py-2 text-center text-sm font-black outline-none" value={getRowValue(r, "monthlyBudget")} onChange={(e) => onRowFieldChange(r._id, "monthlyBudget", e.target.value)} />
                       </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-black uppercase border transition-all ${st.bg}`}>{st.icon} {r.status}</span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => saveRow(r)} title="Save Settings" className="rounded-lg border border-blue-200 bg-blue-100 p-2.5 text-blue-700 shadow-sm transition-all hover:bg-blue-600 hover:text-white"><Save size={18} /></button>
                        <button onClick={() => handleAction(r._id, "active")} title="Approve Account" className="rounded-lg border border-emerald-200 bg-emerald-100 p-2.5 text-emerald-700 shadow-sm transition-all hover:bg-emerald-600 hover:text-white"><CheckCircle size={18} /></button>
                        <button onClick={() => handleAction(r._id, "blocked")} title="Block This Account" className="rounded-lg border border-red-200 bg-red-100 p-2.5 text-red-700 shadow-sm transition-all hover:bg-red-600 hover:text-white"><ShieldAlert size={18} /></button>
                        <button onClick={() => cancelRow(r)} title="Reject & Delete" className="rounded-lg border border-slate-200 bg-slate-100 p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-500 hover:text-white"><Trash2 size={18} /></button>
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
