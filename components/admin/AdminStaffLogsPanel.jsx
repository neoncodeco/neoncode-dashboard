"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  ClipboardList,
  Loader2,
  Megaphone,
  Search,
  Shield,
  UserRound,
} from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { queryKeys } from "@/lib/queryKeys";

const CATEGORY_OPTIONS = [
  { key: "all", label: "All" },
  { key: "payment", label: "Payments" },
  { key: "notification", label: "News" },
  { key: "user", label: "Users" },
  { key: "meta", label: "Meta" },
  { key: "support", label: "Support" },
];

function categoryMeta(category) {
  switch (category) {
    case "payment":
      return { icon: Banknote, className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    case "notification":
      return { icon: Megaphone, className: "text-sky-700 bg-sky-50 border-sky-200" };
    case "user":
      return { icon: UserRound, className: "text-violet-700 bg-violet-50 border-violet-200" };
    case "meta":
      return { icon: ClipboardList, className: "text-amber-700 bg-amber-50 border-amber-200" };
    case "support":
      return { icon: Shield, className: "text-rose-700 bg-rose-50 border-rose-200" };
    default:
      return { icon: Shield, className: "text-gray-700 bg-gray-50 border-gray-200" };
  }
}

function roleBadgeClass(role) {
  return role === "manager"
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : "border-violet-200 bg-violet-50 text-violet-700";
}

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StaffLogRow({ item, compact = false }) {
  const meta = categoryMeta(item.category);
  const Icon = meta.icon;
  const content = (
  <div className={`flex items-start gap-3 ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.className}`}>
      <Icon size={16} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass(item.staffRole)}`}>
          {item.staffRole || "admin"}
        </span>
        <span className="text-sm font-bold text-gray-900">{item.staffName || "Staff"}</span>
        <span className="text-[11px] text-gray-400">· {item.actionLabel}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-gray-800">{item.title}</p>
      {!compact && item.description ? (
        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{item.description}</p>
      ) : null}
      <p className="mt-1 text-[11px] text-gray-400">{formatWhen(item.createdAt)}</p>
    </div>
  </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block border-b border-gray-50 transition hover:bg-gray-50/60 last:border-b-0">
        {content}
      </Link>
    );
  }

  return <div className="border-b border-gray-50 last:border-b-0">{content}</div>;
}

export default function AdminStaffLogsPanel({ compactLimit = 8, showFilters = false, showSearch = false }) {
  const [category, setCategory] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");

  const queryParams = useMemo(() => ({
    page: "1",
    limit: String(compactLimit),
    category,
    q: query,
  }), [compactLimit, category, query]);

  const { data, isLoading: loading } = useApiQuery(
    queryKeys.admin.staffLogs(queryParams),
    `/api/admin/staff-logs?${new URLSearchParams(queryParams).toString()}`,
    { staleTime: 30_000 }
  );

  const visibleRows = data?.data || [];
  const counts = data?.counts || { all: 0 };

  useEffect(() => {
    if (!showSearch) return;
    const timer = setTimeout(() => setQuery(queryInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [queryInput, showSearch]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-black tracking-tight text-gray-900">Staff Activity Log</h3>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Admin & manager actions — payments, news, users, Meta, support
          </p>
        </div>
        <Link href="/admin-dashboard/staff-logs" className="text-xs font-bold text-sky-600 transition hover:underline">
          View all →
        </Link>
      </div>

      {showFilters ? (
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setCategory(option.key)}
                className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${filterChipClass(category === option.key)}`}
              >
                {option.label}
                {counts[option.key] !== undefined ? ` (${counts[option.key]})` : ""}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showSearch ? (
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search staff, action, user..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>
        </div>
      ) : null}

      <div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading staff history...
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">No staff activity found yet.</div>
        ) : (
          visibleRows.map((item) => <StaffLogRow key={item.id} item={item} compact />)
        )}
      </div>
    </div>
  );
}

function filterChipClass(active) {
  return active
    ? "dashboard-accent-surface border-transparent"
    : "border-[var(--dashboard-frame-border)] bg-transparent text-[var(--dashboard-text-muted)] hover:border-[var(--dashboard-frame-border)] hover:text-[var(--dashboard-text-strong)]";
}

export { StaffLogRow, CATEGORY_OPTIONS, categoryMeta, formatWhen, roleBadgeClass, filterChipClass };
