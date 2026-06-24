"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { queryKeys } from "@/lib/queryKeys";
import {
  CATEGORY_OPTIONS,
  StaffLogRow,
  filterChipClass,
} from "@/components/admin/AdminStaffLogsPanel";

export default function AdminStaffLogsPage() {
  const [category, setCategory] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => setQuery(queryInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    setPage(1);
  }, [category, query]);

  const staffLogParams = useMemo(
    () => ({ page, limit, category, q: query }),
    [page, limit, category, query]
  );

  const { data, isLoading: loading } = useApiQuery(
    queryKeys.admin.staffLogs(staffLogParams),
    `/api/admin/staff-logs?${new URLSearchParams({
      page: String(page),
      limit: String(limit),
      category,
      q: query,
    }).toString()}`,
    { staleTime: 30_000 }
  );

  const rows = data?.data || [];
  const counts = data?.counts || { all: 0 };
  const pagination = data?.pagination || {
    page: 1,
    limit,
    totalItems: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  };

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
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
              onClick={() => setPage((prev) => prev + 1)}
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
