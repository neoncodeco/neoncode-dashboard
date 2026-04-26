"use client";

import { useEffect, useMemo, useState } from "react";
import useAppAuth from "@/hooks/useAppAuth";
import { Activity, Filter, Loader2, Search } from "lucide-react";

const TYPE_OPTIONS = [
  { key: "all", label: "All" },
  { key: "support", label: "Support" },
  { key: "payment", label: "Payments" },
  { key: "withdraw", label: "Withdraws" },
  { key: "ads", label: "Ads" },
  { key: "users", label: "Users" },
];

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const statusClass = (status) => {
  const value = (status || "").toLowerCase();
  if (["approved", "active", "success", "completed"].includes(value)) {
    return "border-emerald-300/60 bg-emerald-100/80 text-emerald-700";
  }
  if (["failed", "rejected", "cancelled", "canceled"].includes(value)) {
    return "border-rose-300/60 bg-rose-100/80 text-rose-700";
  }
  return "border-amber-300/60 bg-amber-100/80 text-amber-700";
};

export default function AdminActivityPage() {
  const { token } = useAppAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState({
    all: 0,
    support: 0,
    payment: 0,
    withdraw: 0,
    ads: 0,
    users: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalItems: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => setQuery(queryInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [queryInput, token]);

  useEffect(() => {
    if (!token) return;
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pagination.page),
          limit: String(pagination.limit),
          type,
          q: query,
        });
        const res = await fetch(`/api/admin/activity?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load activity");
        setRows(Array.isArray(json.data) ? json.data : []);
        if (json.counts) setCounts(json.counts);
        if (json.pagination) setPagination(json.pagination);
      } catch (error) {
        console.error("Activity fetch failed:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchActivity();
  }, [token, pagination.page, pagination.limit, type, query]);

  const rangeLabel = useMemo(() => {
    if (pagination.totalItems === 0) return "0-0";
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.totalItems, pagination.page * pagination.limit);
    return `${start}-${end}`;
  }, [pagination]);

  return (
    <div className="space-y-5 bg-transparent p-3 sm:p-4 lg:p-6">
      <div className="dashboard-subpanel mt-3 rounded-[24px] border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--dashboard-text-strong)] sm:text-3xl">Admin Activity</h1>
            <p className="mt-1 text-sm text-[var(--dashboard-text-muted)]">Monitor key actions from support, payments, ads, withdrawals, and registrations.</p>
          </div>
          <div className="dashboard-accent-surface flex h-11 w-11 items-center justify-center rounded-2xl text-white">
            <Activity size={18} />
          </div>
        </div>
      </div>

      <div className="dashboard-subpanel rounded-[22px] border p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="dashboard-accent-surface flex h-8 w-8 items-center justify-center rounded-xl text-white">
            <Filter size={14} />
          </span>
          <p className="text-sm font-bold text-[var(--dashboard-text-strong)]">Filters</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setType(option.key);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                type === option.key
                  ? "dashboard-accent-surface border-transparent text-white"
                  : "border-[var(--dashboard-frame-border)] text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-text-strong)]"
              }`}
            >
              {option.label} ({counts[option.key] || 0})
            </button>
          ))}
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dashboard-text-faint)]" size={16} />
          <input
            value={queryInput}
            onChange={(event) => {
              setQueryInput(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Search by title, user, status, or details..."
            className="w-full rounded-xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)] py-2.5 pl-9 pr-3 text-sm text-[var(--dashboard-text-strong)] outline-none"
          />
        </div>
      </div>

      <div className="dashboard-panel overflow-hidden rounded-[22px] border p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full">
            <thead>
              <tr className="border-b border-[var(--dashboard-frame-border)] bg-[var(--dashboard-table-head)]">
                <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-text-faint)]">Date</th>
                <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-text-faint)]">Type</th>
                <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-text-faint)]">Title</th>
                <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-text-faint)]">User</th>
                <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-text-faint)]">Details</th>
                <th className="px-5 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-text-faint)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dashboard-frame-border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--dashboard-text-muted)]">
                      <Loader2 size={16} className="animate-spin" /> Loading activity...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm font-semibold text-[var(--dashboard-text-muted)]">
                    No activity found for this filter.
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className="bg-[var(--dashboard-table-row)]">
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[var(--dashboard-text-strong)]">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[var(--dashboard-text-muted)]">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[var(--dashboard-text-strong)]">{item.title || "--"}</td>
                    <td className="px-5 py-4 text-sm text-[var(--dashboard-text-muted)]">
                      {item.userName || "Unknown"} {item.userId ? `• ${String(item.userId).slice(-8)}` : ""}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--dashboard-text-muted)]">{item.description || "--"}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(item.status)}`}>
                        {item.status || "--"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-subpanel flex flex-col gap-3 rounded-[20px] border p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--dashboard-text-muted)]">
          Showing {rangeLabel} of {pagination.totalItems}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={!pagination.hasPrev || loading}
            className="rounded-lg border border-[var(--dashboard-frame-border)] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--dashboard-text-muted)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--dashboard-text-strong)]">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={!pagination.hasNext || loading}
            className="rounded-lg border border-[var(--dashboard-frame-border)] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--dashboard-text-muted)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
