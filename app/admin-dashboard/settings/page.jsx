
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import {
  Key, Save, Loader2, ShieldCheck, AlertCircle, Activity, 
  Server, Clock, RefreshCw, Info, Database, Terminal, Plus, Trash2,
  Building2, User, Link2, ChevronDown, ChevronRight, LayoutGrid, Users
} from "lucide-react";
import { useAdminDashboardCache } from "@/hooks/useAdminDashboardCache";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function TokenSettings() {
  const { token } = useFirebaseAuth();
  const { getCache, setCache } = useAdminDashboardCache();
  // এখানে slots: [] অ্যাড করা হয়েছে যাতে ডাটাবেস থেকে লোড হতে পারে
  const [bmConfigs, setBmConfigs] = useState([{ bmName: "", businessId: "", token: "", slots: [] }]);
  const [clientRequests, setClientRequests] = useState([]); 
  const [usdToBdtRate, setUsdToBdtRate] = useState("150");
  const [expandedBM, setExpandedBM] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  /* ---------------- LOAD SYSTEM DATA ---------------- */
  const loadSystemData = useCallback(async () => {
    if (!token) return;
    const cachedSettings = getCache("admin-settings:data");
    if (cachedSettings) {
      setBmConfigs(cachedSettings.bmConfigs || [{ bmName: "", businessId: "", token: "", slots: [] }]);
      setClientRequests(cachedSettings.clientRequests || []);
      setUsdToBdtRate(String(cachedSettings.usdToBdtRate || 150));
      setInitialLoading(false);
      return;
    }
    try {
      const [settingsRes, requestsRes] = await Promise.all([
        fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/ads-request/list", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const settingsData = await settingsRes.json();
      const requestsData = await requestsRes.json();
      const nextPayload = {
        bmConfigs: settingsData.bmConfigs || [{ bmName: "", businessId: "", token: "", slots: [] }],
        clientRequests: requestsData.ok ? requestsData.data || [] : [],
        usdToBdtRate: Number(settingsData.usdToBdtRate || 150),
      };

      // ডাটাবেস থেকে bmConfigs এবং তাদের slots লোড করা
      setBmConfigs(nextPayload.bmConfigs);
      setClientRequests(nextPayload.clientRequests);
      setUsdToBdtRate(String(nextPayload.usdToBdtRate));
      setCache("admin-settings:data", nextPayload);
    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setInitialLoading(false);
    }
  }, [getCache, setCache, token]);

  useEffect(() => { loadSystemData(); }, [loadSystemData]);

  /* ---------------- AUTO MAPPING LOGIC ---------------- */
  const getClientInfo = (metaId) => {
    if (!metaId) return null;
    return clientRequests.find(req => req.MetaAccountID?.trim() === metaId.trim());
  };

  const getAllClientsForMetaId = (metaId) => {
    const normalizedMetaId = metaId?.trim();
    if (!normalizedMetaId) return [];
    return clientRequests.filter((req) => req.MetaAccountID?.trim() === normalizedMetaId);
  };

  /* ---------------- BM HANDLERS ---------------- */
  const addBMRow = () => setBmConfigs([...bmConfigs, { bmName: "", businessId: "", token: "", slots: [] }]);
  const removeBMRow = (i) => setBmConfigs(bmConfigs.filter((_, idx) => idx !== i));
  
  const handleBMChange = (index, field, val) => {
    const newConfigs = [...bmConfigs];
    newConfigs[index][field] = val;
    setBmConfigs(newConfigs);
  };

  /* ---------------- 🆕 DYNAMIC SLOT HANDLERS ---------------- */
  // নতুন স্লট (Field) যোগ করার ফাংশন
  const addSlot = (bmIndex) => {
    const newConfigs = [...bmConfigs];
    if (!newConfigs[bmIndex].slots) newConfigs[bmIndex].slots = [];
    newConfigs[bmIndex].slots.push({ metaId: "" }); 
    setBmConfigs(newConfigs);
  };

  // স্লট রিমুভ করার ফাংশন
  const removeSlot = (bmIndex, slotIndex) => {
    const newConfigs = [...bmConfigs];
    newConfigs[bmIndex].slots.splice(slotIndex, 1);
    setBmConfigs(newConfigs);
  };

  // স্লটে আইডি ইনপুট দেওয়ার ফাংশন
  const handleSlotChange = (bmIndex, slotIndex, val) => {
    const newConfigs = [...bmConfigs];
    newConfigs[bmIndex].slots[slotIndex].metaId = val;
    setBmConfigs(newConfigs);
  };

  /* ---------------- UPDATE SETTINGS ---------------- */
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bmConfigs,
          usdToBdtRate: Number(usdToBdtRate),
        }),
      });
      if (res.ok) {
        setCache("admin-settings:data", {
          bmConfigs,
          clientRequests,
          usdToBdtRate: Number(usdToBdtRate),
        });
        Swal.fire({ icon: "success", title: "Updated", text: "Settings and Slots saved successfully.", timer: 1500 });
      }
    } catch (err) { Swal.fire({ icon: "error", title: "Error", text: "Update failed." }); }
    finally { setLoading(false); }
  };

  if (initialLoading) return <div className="flex items-center justify-center min-h-screen text-white bg-[#081227]"><Loader2 className="animate-spin mr-2" /> Initializing...</div>;

  return (
    <div className="min-h-screen bg-[#081227] p-4 md:p-8 w-full font-sans text-slate-200">
      <div className="w-full space-y-8">
        
        {/* HERO SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1d3b] p-8 rounded-[2rem] border border-[#1e2d4d] shadow-xl">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">System Master Panel</h1>
            <p className="text-slate-400 mt-2 font-medium">Configure Business Managers and map unlimited Ad Slots.</p>
          </div>
          <button onClick={addBMRow} className="flex items-center gap-2  hover:bg-[#2c4167] text-white px-6 py-3 rounded-2xl font-bold transition-all border border-[#2c4167]">
            <Plus size={18} /> Add New BM
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-8">
            
            {/* BM ACCORDION LIST */}
            <div className="space-y-6">
              {bmConfigs.map((bm, bmIndex) => (
                <div key={bmIndex} className="bg-[#0d1d3b] rounded-[2.5rem] border border-[#1e2d4d] shadow-2xl overflow-hidden transition-all">
                  
                  {/* BM Header */}
                  <div 
                    onClick={() => setExpandedBM(expandedBM === bmIndex ? null : bmIndex)}
                    className={`p-6 md:p-8 flex items-center justify-between cursor-pointer transition-all ${expandedBM === bmIndex ? 'bg-[#132546]/80' : 'hover:bg-[#132546]/40'}`}
                  >
                    <div className="flex items-center gap-5">
                       <div className="bg-blue-600 p-4 rounded-2xl shadow-lg"><Building2 size={24}/></div>
                       <div>
                          <h2 className="text-xl font-black text-white uppercase">{bm.bmName || `Node ${bmIndex + 1}`}</h2>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Business ID: {bm.businessId || "Unset"} • {bm.slots?.length || 0} Slots Attached</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <button onClick={(e) => { e.stopPropagation(); removeBMRow(bmIndex); }} className="text-red-400/50 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                       {expandedBM === bmIndex ? <ChevronDown size={24}/> : <ChevronRight size={24}/>}
                    </div>
                  </div>

                  {/* BM Content */}
                  {expandedBM === bmIndex && (
                    <div className="p-8 md:p-10 space-y-8 border-t border-[#1e2d4d]">
                      
                      {/* Configuration Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input placeholder="BM Name" value={bm.bmName} onChange={(e) => handleBMChange(bmIndex, "bmName", e.target.value)} className="w-full p-4 bg-[#081227] border border-[#1e2d4d] rounded-2xl text-sm font-semibold text-white focus:border-blue-500 outline-none" />
                        <input placeholder="Business ID" value={bm.businessId} onChange={(e) => handleBMChange(bmIndex, "businessId", e.target.value)} className="w-full p-4 bg-[#081227] border border-[#1e2d4d] rounded-2xl text-sm font-semibold text-white focus:border-blue-500 outline-none" />
                      </div>
                      <textarea value={bm.token} onChange={(e) => handleBMChange(bmIndex, "token", e.target.value)} rows={2} placeholder="EAA..." className="w-full p-5 bg-[#081227] border border-[#1e2d4d] rounded-2xl text-xs font-mono text-blue-300 resize-none shadow-inner" />

                     
                     {/* 🏆 UNLIMITED DYNAMIC SLOTS TABLE */}
<div className="space-y-4">
   <div className="flex justify-between items-center">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><LayoutGrid size={14}/> Attached Ad Slots</h3>
      <button onClick={() => addSlot(bmIndex)} className="text-[10px] font-black bg-blue-600/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all">+ Add New Slot</button>
   </div>

   <div className="overflow-hidden rounded-2xl border border-[#1e2d4d]">
      <table className="w-full text-left bg-[#081227]/40">
         <thead className="bg-[#132546]/50 text-[10px] font-black text-slate-500 uppercase">
            <tr>
               <th className="px-6 py-4">Slot</th>
               <th className="px-6 py-4">Meta ID Mapping</th>
               <th className="px-6 py-4">Connected Profiles</th> {/* নাম পরিবর্তন */}
               <th className="px-6 py-4 text-right">Action</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-[#1e2d4d]">
            {bm.slots?.map((slot, sIdx) => {
              // ঐ মেটা আইডির জন্য সব ইউজারকে খুঁজে আনবে
              const matchedClients = getAllClientsForMetaId(slot.metaId);
              
              return (
                <tr key={sIdx} className="hover:bg-white/5 transition-all align-top">
                   <td className="px-6 py-4 font-black text-slate-600 text-xs">#{sIdx + 1}</td>
                   <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-2">
                            <Link2 size={12} className="text-blue-500" />
                            <input 
                               placeholder="Meta ID" 
                               value={slot.metaId}
                               onChange={(e) => handleSlotChange(bmIndex, sIdx, e.target.value)}
                               className="bg-[#081227] border border-[#1e2d4d] rounded-lg px-3 py-1.5 text-xs font-mono text-blue-300 focus:border-blue-500 outline-none w-44" 
                            />
                         </div>
                         {/* যদি ইউজার থাকে তবে একটি ছোট ব্যাজ দেখাবে */}
                         {matchedClients.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md w-fit">
                               <Users size={10}/> {matchedClients.length} Profiles Linked
                            </span>
                         )}
                      </div>
                   </td>

                   {/* 👤 Connected Profiles with Photos */}
                   <td className="px-6 py-4">
                      {matchedClients.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                           {matchedClients.map((client, cIdx) => (
                             <div key={cIdx} className="flex items-center gap-3 bg-[#132546]/60 p-2.5 rounded-2xl border border-white/5 shadow-sm hover:border-blue-500/30 transition-all group">
                                
                                {/* ইউজার প্রোফাইল ফটো বা এভাটার */}
                                <div className="relative">
                                   {client.photoURL ? (
                                      <Image
                                        src={client.photoURL}
                                        alt="profile"
                                        width={36}
                                        height={36}
                                        className="h-9 w-9 rounded-full object-cover border-2 border-blue-500/20 group-hover:border-blue-500"
                                      />
                                   ) : (
                                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white/10">
                                         {client.accountName?.charAt(0).toUpperCase() || <User size={16}/>}
                                      </div>
                                   )}
                                   {/* একটি ছোট অনলাইন ডট বা আইকন */}
                                   <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-[#0d1d3b] rounded-full"></div>
                                </div>

                                <div className="min-w-0">
                                   <p className="text-[12px] font-black text-white leading-tight truncate group-hover:text-blue-300 transition-colors">
                                      {client.accountName}
                                   </p>
                                   <p className="text-[10px] text-slate-500 truncate font-medium">
                                      {client.userEmail}
                                   </p>
                                </div>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-700 italic py-2">
                           <div className="h-8 w-8 rounded-full border border-dashed border-slate-700 flex items-center justify-center">
                              <Users size={14}/>
                           </div>
                           <span className="text-[11px]">No profile connected</span>
                        </div>
                      )}
                   </td>

                   <td className="px-6 py-4 text-right">
                      <button onClick={() => removeSlot(bmIndex, sIdx)} className="text-slate-600 hover:text-red-400 p-2 transition-colors">
                         <Trash2 size={16}/>
                      </button>
                   </td>
                </tr>
              );
            })}
         </tbody>
      </table>
   </div>
</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={handleUpdate} disabled={loading} className="bg-[#8ab4ff] text-[#081227] flex items-center gap-4 px-12 py-5 rounded-[2rem] font-black shadow-xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} SAVE MASTER CONFIGURATIONS
              </button>
            </div>

            {/* INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="rounded-[2.5rem] border border-[#2c4167] bg-gradient-to-br from-[#132546] to-[#0d1d3b] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-4"><Info size={28} className="text-[#9fb3de]" /><h3 className="text-xl font-black">Graph API Docs</h3></div>
                  <p className="text-slate-400 text-xs font-medium italic">Map Meta Asset IDs to system slots to enable automation.</p>
                  <button className="bg-[#8ab4ff] text-[#081227] rounded-xl px-6 py-3 text-xs font-black uppercase">VIEW DOCS</button>
                </div>
              </div>
              <div className="bg-[#0d1d3b] rounded-[2.5rem] p-8 border border-[#1e2d4d] shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400"><ShieldCheck size={20} /></div>
                  <h3 className="text-lg font-black text-white">Privacy Node</h3>
                </div>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">All mapping configurations are encrypted and isolated per BM container.</p>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-8">
            <div className="bg-[#0d1d3b] p-8 rounded-[2.5rem] border border-[#1e2d4d] shadow-xl space-y-6">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2"><Server size={14} /> System Health</h3>
               <div className="space-y-4 text-xs font-bold uppercase tracking-tighter">
                  <div className="flex justify-between py-2 border-b border-[#1e2d4d]"><span className="text-slate-500">API Status</span><span className="text-emerald-500 flex items-center gap-2">Healthy</span></div>
                  <div className="flex justify-between py-2 border-b border-[#1e2d4d]"><span className="text-slate-500">Active BMs</span><span className="text-white">{bmConfigs.length} Nodes</span></div>
                  <div className="flex justify-between py-2"><span className="text-slate-500">Total Slots</span><span className="text-blue-400">{bmConfigs.reduce((acc, curr) => acc + (curr.slots?.length || 0), 0)} Linked</span></div>
               </div>
            </div>
            <div className="bg-[#0d1d3b] flex flex-col items-center rounded-[2.5rem] border border-[#1e2d4d] p-8 text-center shadow-lg">
                <Activity size={32} className="mb-3 text-[#8ab4ff]" />
                <h4 className="mb-2 text-sm font-black uppercase text-[#dce8ff]">Real-time Tracking</h4>
                <p className="text-[10px] font-bold leading-relaxed text-[#9fb3de]">System maps meta IDs to slots dynamically using the request database.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
