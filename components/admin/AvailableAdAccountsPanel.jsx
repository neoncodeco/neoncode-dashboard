"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  Loader2,
  Megaphone,
  UserPlus,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useApiQuery, useInvalidateApi } from "@/hooks/useApiQuery";
import { queryKeys } from "@/lib/queryKeys";
import { formatUsd } from "@/lib/currency";
import AssignAdAccountModal from "@/components/admin/AssignAdAccountModal";

function connectionToneClass(tone) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "danger":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function appStatusClass(status) {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
    case "unassigned":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "blocked":
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function ConnectionBadge({ status, label }) {
  const Icon = status === "connected" ? Wifi : WifiOff;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${connectionToneClass(status === "connected" ? "success" : status === "error" ? "danger" : "warning")}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

function AccountRow({ account, compact = false, onAssign }) {
  const primaryHref = !onAssign ? account.hrefRequest || account.hrefUser : null;
  const RowTag = primaryHref ? Link : "div";

  return (
    <RowTag
      href={primaryHref || undefined}
      className={`flex flex-col gap-3 border-b border-gray-100 px-4 py-3 transition last:border-b-0 sm:flex-row sm:items-center sm:justify-between ${
        primaryHref ? "cursor-pointer hover:bg-sky-50/50" : ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
          <Megaphone size={15} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{account.accountName}</p>
          <p className="mt-0.5 font-mono text-[11px] text-gray-500">
            {account.metaId ? `Meta ID · ${account.metaId}` : "Meta ID pending"}
          </p>
          {!compact ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${appStatusClass(account.appStatus)}`}>
                {account.appStatus}
              </span>
              {account.fbAccountStatusLabel ? (
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                  Meta · {account.fbAccountStatusLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        {!compact && account.remaining > 0 ? (
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Available</p>
            <p className="text-sm font-black text-emerald-600">{formatUsd(account.remaining)}</p>
          </div>
        ) : null}

        {account.assignedUser ? (
          account.hrefUser ? (
            <Link
              href={account.hrefUser}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 transition hover:border-sky-200 hover:bg-sky-50"
            >
              <UserRound size={14} className="shrink-0 text-sky-600" />
              <div className="min-w-0 text-left">
                <p className="truncate text-xs font-bold text-gray-900">{account.assignedUser.name}</p>
                <p className="truncate text-[10px] text-gray-500">{account.assignedUser.email}</p>
              </div>
              <ExternalLink size={12} className="shrink-0 text-gray-400" />
            </Link>
          ) : (
            <div className="text-xs text-gray-500">{account.assignedUser.email}</div>
          )
        ) : (
          <span className="rounded-full border border-dashed border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700">
            Unassigned
          </span>
        )}

        {onAssign && account.metaId ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onAssign(account);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
          >
            <UserPlus size={14} />
            {account.isAssigned ? "Reassign" : "Assign"}
          </button>
        ) : null}
      </div>
    </RowTag>
  );
}

function BmSection({ bm, defaultOpen = false, accountLimit = null, onAssign }) {
  const [open, setOpen] = useState(defaultOpen);
  const accounts = accountLimit ? bm.accounts.slice(0, accountLimit) : bm.accounts;
  const hiddenCount = accountLimit ? Math.max(0, bm.accounts.length - accountLimit) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-black text-gray-900">{bm.bmName}</p>
              <ConnectionBadge status={bm.connectionStatus} label={bm.connectionLabel} />
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-gray-500">
              {bm.businessId ? `BM ID · ${bm.businessId}` : "BM ID not set"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {bm.accountCount} account{bm.accountCount === 1 ? "" : "s"} · {bm.assignedCount} assigned
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full border border-gray-200 p-1 text-gray-500">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </button>

        <Link
          href={bm.hrefSettings}
          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-sky-600 transition hover:bg-sky-50"
        >
          BM settings
          <ExternalLink size={12} />
        </Link>
      </div>

      {open ? (
        <div>
          {bm.connectionMessage ? (
            <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-2 text-[11px] text-gray-500">
              {bm.connectionMessage}
            </div>
          ) : null}
          {accounts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">No ad accounts found under this BM.</div>
          ) : (
            accounts.map((account) => (
              <AccountRow
                key={`${bm.businessId}-${account.metaId || account.requestId || account.accountName}`}
                account={{ ...account, bmId: account.bmId || bm.businessId, bmName: account.bmName || bm.bmName }}
                compact={Boolean(accountLimit)}
                onAssign={onAssign}
              />
            ))
          )}
          {hiddenCount > 0 ? (
            <div className="border-t border-gray-100 px-4 py-3 text-center">
              <Link href="/admin-dashboard/available-ad-accounts" className="text-xs font-bold text-sky-600 hover:underline">
                + {hiddenCount} more account{hiddenCount === 1 ? "" : "s"} · View all
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, hint, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4" style={{ borderLeft: `3px solid ${accent}` }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function AvailableAdAccountsPanel({ previewLimit = 3, accountsPerBm = 4 }) {
  const invalidate = useInvalidateApi();
  const [assignTarget, setAssignTarget] = useState(null);

  const { data, isLoading: loading, error: queryError, refetch } = useApiQuery(
    queryKeys.admin.availableAdAccounts(),
    "/api/admin/stats/available-ad-accounts",
    { staleTime: 45_000 }
  );

  const error = queryError?.message || "";
  const businessManagers = useMemo(
    () => (Array.isArray(data?.businessManagers) ? data.businessManagers : []).slice(0, previewLimit),
    [data, previewLimit]
  );

  const summary = data?.summary;

  const handleAssigned = () => {
    void refetch();
    invalidate(queryKeys.admin.availableAdAccounts());
    invalidate(queryKeys.admin.metaAds());
  };

  return (
    <div className="space-y-4">
      <AssignAdAccountModal
        open={Boolean(assignTarget)}
        account={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={handleAssigned}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-black tracking-tight text-gray-900">Available Ad Accounts</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            All Meta ad accounts grouped by BM with connected status and assigned users
          </p>
        </div>
        <Link href="/admin-dashboard/available-ad-accounts" className="text-xs font-bold text-sky-600 transition hover:underline">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-12 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading ad accounts from Meta...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Business managers" value={summary?.totalBMs ?? 0} hint={`${summary?.connectedBMs ?? 0} connected`} accent="#6366f1" />
            <SummaryCard label="Ad accounts" value={summary?.totalAccounts ?? 0} hint="Under all BMs" accent="#0ea5e9" />
            <SummaryCard label="Assigned" value={summary?.assignedAccounts ?? 0} hint="Linked to users" accent="#10b981" />
            <SummaryCard label="Unassigned" value={summary?.unassignedAccounts ?? 0} hint="No user mapped" accent="#f59e0b" />
          </div>

          {businessManagers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
              <Layers size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">No business managers configured</p>
              <p className="mt-1 text-sm text-gray-500">Add BM tokens in Settings to load ad accounts.</p>
              <Link href="/admin-dashboard/settings" className="mt-4 inline-flex text-xs font-bold text-sky-600 hover:underline">
                Open BM settings →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {businessManagers.map((bm, index) => (
                <BmSection
                  key={`${bm.businessId}-${bm.bmIndex}`}
                  bm={bm}
                  defaultOpen={index === 0}
                  accountLimit={accountsPerBm}
                  onAssign={setAssignTarget}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { AccountRow, BmSection, SummaryCard, ConnectionBadge, appStatusClass, AssignAdAccountModal };
