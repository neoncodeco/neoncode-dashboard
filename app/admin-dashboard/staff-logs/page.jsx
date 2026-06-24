"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import useAppAuth from "@/hooks/useAppAuth";
import {
  CATEGORY_OPTIONS,
  StaffLogRow,
  filterChipClass,
} from "@/components/admin/AdminStaffLogsPanel";

export default function AdminStaffLogsPage() {
  const { token } = useAppAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState({ all: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => setQuery(queryInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [category, query]);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        category,
        q: query,
      });
      const res = await fetch(`/api/admin/staff-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load staff logs");
      setRows(Array.isArray(json.data) ? json.data : []);
      if (json.counts) setCounts(json.counts);
      if (json.pagination) setPagination(json.pagination);
    } catch (error) {
      console.error("Staff logs page fetch failed:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, category, query]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const rangeLabel = useMemo(() => {
    if (pagination.totalItems === 0) return "0-0";
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.totalItems, pagination.page * pagination.limit);
    return `${start}-${end}`;
  }, [pagination]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Staff Activity Log</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Complete history of admin and manager actions across the platform.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setCategory(option.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${filterChipClass(category === option.key)}`}
              >
                {option.label}
                {counts[option.key] !== undefined ? ` (${counts[option.key]})` : ""}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search by staff name, action, user, or details..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>
        </div>

        <div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Loading activity history...
            </div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-gray-500">No matching staff activity found.</div>
          ) : (
            rows.map((item) => <StaffLogRow key={item.id} item={item} />)
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Showing {rangeLabel} of {pagination.totalItems} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrev || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs font-bold text-gray-500">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNext || loading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
