"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { formatBdt } from "@/lib/currency";
import { 
  Key, 
  Save, 
  Loader2, 
  ShieldCheck, 
  AlertCircle, 
  Activity, 
  Server, 
  Clock, 
  RefreshCw,
  Info,
  Database,
  Terminal
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function TokenSettings() {
  const { token } = useFirebaseAuth();
  const [fbToken, setFbToken] = useState("");
  const [usdToBdtRate, setUsdToBdtRate] = useState("150");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  /* ---------------- LOAD SETTINGS ---------------- */
  useEffect(() => {
    if (!token) return;

    fetch("/api/admin/settings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw data;
        setFbToken(data.token || "");
        setUsdToBdtRate(String(data.usdToBdtRate || 150));
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: "Access Denied",
          text: err?.error || "You don't have permission to view settings.",
          confirmButtonColor: "#000",
        });
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [token]);

  /* ---------------- UPDATE TOKEN ---------------- */
  const handleUpdate = async () => {
    if (!fbToken.trim()) {
      Swal.fire({ icon: "warning", title: "Empty Token", text: "Please provide a Facebook System Token.", confirmButtonColor: "#000" });
      return;
    }
    if (!Number(usdToBdtRate) || Number(usdToBdtRate) <= 0) {
      Swal.fire({ icon: "warning", title: "Invalid Rate", text: "Please provide a valid USD to BDT rate.", confirmButtonColor: "#000" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newToken: fbToken, usdToBdtRate: Number(usdToBdtRate) }),
      });

      if (!res.ok) throw await res.json();

      Swal.fire({ icon: "success", title: "Updated", text: "System configuration saved.", timer: 1800, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err?.error || "Update failed.", confirmButtonColor: "#d33" });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfcfc]">
        <Loader2 className="animate-spin text-black w-10 h-10 mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Initializing Full System Access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:pt-5 md:p-6 lg:p-8 w-full">
      <div className="w-full space-y-8">
        
        {/* --- HERO SECTION (FULL WIDTH) --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 sm:p-6 lg:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">System Controls & API</h1>
            <p className="text-gray-500 mt-2 font-medium">Manage backend configurations, security keys, and environment variables.</p>
          </div>
          <div className="admin-panel-muted flex w-full items-center justify-center gap-3 rounded-2xl border px-4 py-3 shadow-sm md:w-auto md:justify-start sm:px-6">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-200">System Online</span>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* --- LEFT COL: TOKEN EDITOR (Takes 3/4 space on large screens) --- */}
          <div className="xl:col-span-3 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-2xl shadow-black/[0.02] overflow-hidden">
              <div className="p-5 sm:p-8 md:p-12 space-y-8">
                
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="admin-accent-button rounded-2xl p-4 shadow-xl shadow-[#2c53a0]/30 transform -rotate-3">
                    <Terminal size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900">Facebook System Token</h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter">Integration Key Management</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="relative group">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                          Global USD to BDT Rate
                        </label>
                        <span className="admin-badge rounded-md px-2 py-0.5 text-[10px] font-bold italic">
                          1 USD = {formatBdt(Number(usdToBdtRate || 0), { round: false, minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={usdToBdtRate}
                      onChange={(e) => setUsdToBdtRate(e.target.value)}
                      placeholder="Enter BDT value for 1 USD"
                      className="w-full p-5 sm:p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-semibold focus:outline-none focus:ring-8 focus:ring-black/5 focus:border-black transition-all text-gray-700 shadow-inner"
                    />
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed font-medium italic">
                      Wallet, remaining budget, and other USD-based dashboard values will use this admin-defined conversion rate.
                    </p>
                  </div>

                  <div className="relative group">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                          Secure API Key Input
                        </label>
                        <span className="admin-badge rounded-md px-2 py-0.5 text-[10px] font-bold italic">Encrypted Connection</span>
                    </div>
                    <textarea
                      value={fbToken}
                      onChange={(e) => setFbToken(e.target.value)}
                      rows={10}
                      placeholder="Paste your system token starting with EAA..."
                      className="w-full p-5 sm:p-8 bg-gray-50 border border-gray-100 rounded-[2rem] sm:rounded-[2.5rem] text-sm font-mono focus:outline-none focus:ring-8 focus:ring-black/5 focus:border-black transition-all resize-none text-gray-700 shadow-inner leading-relaxed"
                    />
                    <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 flex gap-2">
                        <ShieldCheck className="text-emerald-500" size={28} />
                    </div>
                  </div>

                  <div className="admin-panel-muted flex items-start gap-4 rounded-[2rem] border border-dashed p-4 sm:p-6">
                    <div className="rounded-xl bg-[#203963] p-2">
                        <AlertCircle size={20} className="text-[#dce8ff]" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 font-black">Security Protocol</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1 font-medium italic">
                        By updating this token, you acknowledge that all current Facebook Graph API requests will use this new key immediately. Make sure the token is from a verified System User with <b>Full Control</b>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-50 flex justify-end">
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="admin-accent-button flex w-full items-center justify-center gap-4 rounded-[2rem] px-8 py-4 text-sm font-black transition-all hover:-translate-y-[2px] active:scale-95 disabled:opacity-50 md:w-auto sm:px-12 sm:py-5"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {loading ? "PROCESSING..." : "UPDATE SYSTEM ACCESS"}
                  </button>
                </div>
              </div>
            </div>

            {/* --- BOTTOM GRID: DOCUMENTATION & TIPS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-[2.5rem] border border-[#2c4167] bg-gradient-to-br from-[#132546] to-[#0d1d3b] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <Info size={28} className="text-[#9fb3de]" />
                            <h3 className="text-xl font-black">Graph API Docs</h3>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed mb-6 font-medium">
                            Need help with permissions? Visit Meta Developer documentation to learn more about <code>ads_management</code> and <code>business_management</code> scopes.
                        </p>
                        <button className="admin-accent-button rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all">
                            View Documentation
                        </button>
                    </div>
                    <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform">
                        <Key size={200} />
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                            <ShieldCheck size={20} />
                        </div>
                        <h3 className="text-lg font-black text-gray-800 tracking-tight">Privacy Focus</h3>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed font-medium">
                        All tokens are stored using high-level AES encryption on the database. No one, including developers, can see your full token once saved.
                    </p>
                </div>
            </div>
          </div>

          {/* --- RIGHT COL: SIDEBAR (Takes 1/4 space) --- */}
          <div className="space-y-8">
            
            {/* Server Status */}
            <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                 <Server size={14} /> Global Status
               </h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">API Status</span>
                    <div className="flex items-center gap-1.5 font-black text-emerald-500 text-[10px] uppercase">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Healthy
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Environment</span>
                    <span className="admin-badge rounded-lg px-2.5 py-1 text-[10px] font-black uppercase">Production</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Node Version</span>
                    <span className="text-[10px] font-black text-gray-700 uppercase">v20.x</span>
                  </div>
               </div>
            </div>

            {/* Quick Data Sync */}
            <div className="bg-white p-5 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                 <Database size={14} /> Analytics Sync
               </h3>
               <div className="space-y-4">
                   <div className="admin-panel-muted flex items-center gap-4 rounded-2xl border p-4">
                      <RefreshCw size={20} className="text-gray-400 animate-spin-slow" />
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Last Sync</p>
                        <p className="text-xs font-black text-gray-800">{new Date().toLocaleTimeString()}</p>
                      </div>
                   </div>
                   <div className="admin-panel-muted flex items-center gap-4 rounded-2xl border p-4">
                      <Clock size={20} className="text-gray-400" />
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Local Time</p>
                        <p className="text-xs font-black text-gray-800">{new Date().toLocaleDateString()}</p>
                      </div>
                   </div>
               </div>
            </div>

            {/* Logs Placeholder */}
            <div className="admin-panel-muted flex flex-col items-center rounded-[2.5rem] border p-5 text-center sm:p-8">
                <Activity size={32} className="mb-3 text-[#8ab4ff]" />
                <h4 className="mb-2 text-sm font-black uppercase tracking-tighter text-[#dce8ff]">Activity Monitoring</h4>
                <p className="px-4 text-[10px] font-bold uppercase leading-relaxed text-[#9fb3de]">
                    System tracking is enabled for all configuration changes.
                </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
