"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Search,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Layers,
  ShieldAlert,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Mail,
  Hash,
  DollarSign,
  Link2,
  Sparkles,
  Filter,
} from "lucide-react";
import { formatUsd } from "@/lib/currency";
import { useAdminDashboardCache } from "@/hooks/useAdminDashboardCache";
import useAppAuth from "@/hooks/useAppAuth";
import { normalizeAssignedAccounts } from "@/lib/adAccountRequests";
import { serializeMongoId } from "@/lib/serializeMongoId";
import Swal from "sweetalert2";

const normalizeAdRequestRows = (rows) =>
  (Array.isArray(rows) ? rows : []).map((doc) => ({
    ...doc,
    _id: serializeMongoId(doc?._id),
  }));

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "blocked", label: "Blocked" },
  { id: "rejected", label: "Rejected" },
];

const getStatusMeta = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        icon: CheckCircle,
      };
    case "pending":
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
        icon: Clock,
      };
    case "blocked":
      return {
        badge: "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500",
        icon: ShieldAlert,
      };
    case "rejected":
    case "cancelled":
      return {
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
        icon: XCircle,
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
        icon: AlertTriangle,
      };
  }
};

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      <Icon size={12} />
      {status || "unknown"}
    </span>
  );
}

function FormField({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
        {Icon ? <Icon size={12} className="text-gray-400" /> : null}
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

export default function AdminAdAccountApprove() {
  const router = useRouter();
  const { token } = useAppAuth();
  const { getCache, setCache } = useAdminDashboardCache();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showManualAdd, setShowManualAdd] = useState(true);

  const [newAccounts, setNewAccounts] = useState([
    {
      accountName: "",
      bmId: "",
      monthlyBudget: 0,
      userUid: "",
      userEmail: "",
      MetaAccountID: "",
      status: "active",
    },
  ]);

  const load = useCallback(
    async (options = {}) => {
      if (!options.force) {
        const cachedPayload = getCache("admin-meta-ads:data");
        if (cachedPayload) {
          setData(normalizeAdRequestRows(cachedPayload.data || []));
          setInitialLoading(false);
          return;
        }
      }

      try {
        const fetchOpts = { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" };
        const listRes = await fetch("/api/admin/ads-request/list", fetchOpts);
        const listJson = await listRes.json();
        const nextPayload = {
          data: listRes.ok ? normalizeAdRequestRows(listJson.data || []) : [],
        };

        if (listRes.ok) setData(nextPayload.data);
        setCache("admin-meta-ads:data", nextPayload);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setInitialLoading(false);
      }
    },
    [getCache, setCache, token]
  );

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const openAccount = (row) => {
    const id = serializeMongoId(row?._id);
    if (!id) return;
    router.push(`/admin-dashboard/meta-ads/${encodeURIComponent(id)}`);
  };

  const createEmptyManualAccount = () => ({
    accountName: "",
    bmId: "",
    monthlyBudget: 0,
    userUid: "",
    userEmail: "",
    MetaAccountID: "",
    status: "active",
  });

  const addManualRow = () => setNewAccounts((prev) => [...prev, createEmptyManualAccount()]);
  const removeManualRow = (index) =>
    setNewAccounts((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const updateManualRow = (index, field, value) => {
    setNewAccounts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addManualAccount = async () => {
    const assignedAccounts = normalizeAssignedAccounts(newAccounts);
    if (assignedAccounts.length === 0) return Swal.fire("Missing Info");
    const res = await fetch("/api/admin/ads-request/approve", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...assignedAccounts[0],
        assignedAccounts,
        monthlyBudget: Number(assignedAccounts[0]?.monthlyBudget || 0),
        accountName: assignedAccounts[0]?.accountName || "Manual Account",
        bmId: assignedAccounts[0]?.bmId || "",
        userUid: assignedAccounts[0]?.userUid || "",
        userEmail: assignedAccounts[0]?.userEmail || "",
        MetaAccountID: assignedAccounts[0]?.MetaAccountID || "",
      }),
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      const newId = serializeMongoId(json?.data?._id);
      setNewAccounts([createEmptyManualAccount()]);
      load({ force: true });
      if (newId) {
        router.push(`/admin-dashboard/meta-ads/${encodeURIComponent(newId)}`);
      } else {
        Swal.fire({ title: "Account created", icon: "success", timer: 1500, showConfirmButton: false });
      }
    }
  };

  const stats = useMemo(() => {
    const counts = { total: data.length, active: 0, pending: 0, blocked: 0 };
    for (const row of data) {
      const s = String(row.status || "").toLowerCase();
      if (s === "active") counts.active += 1;
      else if (s === "pending") counts.pending += 1;
      else if (s === "blocked") counts.blocked += 1;
    }
    return counts;
  }, [data]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return data.filter((d) => {
      const matchesSearch =
        !s ||
        d.accountName?.toLowerCase().includes(s) ||
        d.userEmail?.toLowerCase().includes(s) ||
        d.bmId?.includes(s) ||
        d.MetaAccountID?.includes(s);
      const matchesStatus =
        statusFilter === "all" || String(d.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  if (initialLoading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-9 w-9 animate-spin text-sky-500" />
        <p className="text-sm font-medium text-gray-500">Loading ad accounts…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
            <Layers size={11} />
            Meta Ads
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Ad Account Workspace</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Provision accounts, map BM slots, and manage approvals from one control panel.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, Meta ID…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:w-72"
            />
          </div>
          <button
            onClick={() => load({ force: true })}
            disabled={loading}
            className="admin-accent-button flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total accounts", value: stats.total, accent: "#3b82f6", icon: Layers },
          { label: "Active", value: stats.active, accent: "#10b981", icon: CheckCircle },
          { label: "Pending", value: stats.pending, accent: "#f59e0b", icon: Clock },
          { label: "Blocked", value: stats.blocked, accent: "#ef4444", icon: ShieldAlert },
        ].map((item) => (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div
              className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
              style={{ background: item.accent }}
            />
            <div className="flex items-start justify-between pl-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-gray-900">{item.value}</p>
              </div>
              <div
                className="rounded-xl p-2"
                style={{ background: `${item.accent}18`, color: item.accent }}
              >
                <item.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual entry */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowManualAdd((v) => !v)}
          className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 text-left transition hover:bg-gray-50/80"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 p-2.5 text-white shadow-md shadow-sky-200">
              <Plus size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">Quick provision</h2>
              <p className="text-xs text-gray-500">Add one or more ad accounts manually</p>
            </div>
          </div>
          {showManualAdd ? (
            <ChevronUp size={18} className="shrink-0 text-gray-400" />
          ) : (
            <ChevronDown size={18} className="shrink-0 text-gray-400" />
          )}
        </button>

        {showManualAdd ? (
          <div className="space-y-4 p-5">
            {newAccounts.map((account, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50/80 to-white p-4 sm:p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Account slot {index + 1}
                  </span>
                  {newAccounts.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeManualRow(index)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField label="Account name" icon={Layers}>
                    <input
                      className={inputClass}
                      placeholder="e.g. Brand Ads"
                      value={account.accountName}
                      onChange={(e) => updateManualRow(index, "accountName", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Monthly budget (USD)" icon={DollarSign}>
                    <input
                      type="number"
                      className={inputClass}
                      placeholder="0"
                      value={account.monthlyBudget}
                      onChange={(e) => updateManualRow(index, "monthlyBudget", e.target.value)}
                    />
                  </FormField>
                  <FormField label="User UID" icon={Hash}>
                    <input
                      className={inputClass}
                      placeholder="Firebase / user ID"
                      value={account.userUid}
                      onChange={(e) => updateManualRow(index, "userUid", e.target.value)}
                    />
                  </FormField>
                  <FormField label="User email" icon={Mail}>
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="user@example.com"
                      value={account.userEmail}
                      onChange={(e) => updateManualRow(index, "userEmail", e.target.value)}
                    />
                  </FormField>
                  <FormField label="Meta account ID" icon={Link2}>
                    <input
                      className={`${inputClass} font-mono`}
                      placeholder="act_…"
                      value={account.MetaAccountID}
                      onChange={(e) => updateManualRow(index, "MetaAccountID", e.target.value)}
                    />
                  </FormField>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={addManualRow}
                className="admin-secondary-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
              >
                <Plus size={15} />
                Add another slot
              </button>
              <button
                onClick={addManualAccount}
                className="admin-accent-button flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
              >
                <Sparkles size={15} />
                Save & provision
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Accounts list */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-gray-900">All ad accounts</h2>
            <p className="text-xs text-gray-500">
              {filtered.length} of {data.length} shown · Click any row to open full profile
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  statusFilter === f.id
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="rounded-2xl bg-gray-100 p-4 text-gray-400">
              <Layers size={28} />
            </div>
            <p className="text-sm font-bold text-gray-700">No accounts match your filters</p>
            <p className="max-w-sm text-xs text-gray-500">
              Try a different search term or status filter, or provision a new account above.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => openAccount(r)}
                  className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:bg-sky-50/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600">
                        <Layers size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-gray-900">{r.accountName || "Ad Account"}</p>
                        <p className="truncate text-xs text-gray-500">{r.userEmail || "No email"}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-gray-300" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-xs font-bold text-gray-600">{formatUsd(r.monthlyBudget)}</span>
                    {r.MetaAccountID ? (
                      <span className="truncate font-mono text-[10px] text-gray-400">{r.MetaAccountID}</span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-500">
                    <th className="px-5 py-4">Account</th>
                    <th className="px-5 py-4">Meta ID</th>
                    <th className="px-5 py-4 text-center">Budget</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r) => (
                    <tr
                      key={r._id}
                      onClick={() => openAccount(r)}
                      className="group cursor-pointer transition hover:bg-sky-50/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-sky-50 p-2 text-sky-600 transition group-hover:bg-sky-100">
                            <Layers size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-sky-700">
                              {r.accountName || "Ad Account"}
                            </p>
                            <p className="text-xs text-gray-500">{r.userEmail || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-gray-600">{r.MetaAccountID || "—"}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-bold text-gray-900">{formatUsd(r.monthlyBudget)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ChevronRight
                          size={18}
                          className="ml-auto text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-sky-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
