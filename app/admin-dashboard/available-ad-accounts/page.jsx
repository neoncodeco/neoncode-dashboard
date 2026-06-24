"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, Loader2, RefreshCw, Search } from "lucide-react";
import { useApiQuery, useInvalidateApi } from "@/hooks/useApiQuery";
import { queryKeys } from "@/lib/queryKeys";
import {
  AssignAdAccountModal,
  BmSection,
  SummaryCard,
} from "@/components/admin/AvailableAdAccountsPanel";

export default function AvailableAdAccountsPage() {
  const [query, setQuery] = useState("");
  const [assignTarget, setAssignTarget] = useState(null);
  const invalidate = useInvalidateApi();

  const { data, isLoading: loading, error: queryError, refetch: fetchData } = useApiQuery(
    queryKeys.admin.availableAdAccounts(),
    "/api/admin/stats/available-ad-accounts",
    { staleTime: 45_000 }
  );

  const error = queryError?.message || "";

  const filteredManagers = useMemo(() => {
    const managers = Array.isArray(data?.businessManagers) ? data.businessManagers : [];
    const q = query.trim().toLowerCase();
    if (!q) return managers;

    return managers
      .map((bm) => {
        const bmMatch =
          bm.bmName?.toLowerCase().includes(q) ||
          bm.businessId?.toLowerCase().includes(q) ||
          bm.connectionLabel?.toLowerCase().includes(q);

        const accounts = (bm.accounts || []).filter((account) => {
          const haystack = [
            account.accountName,
            account.metaId,
            account.appStatus,
            account.fbAccountStatusLabel,
            account.assignedUser?.name,
            account.assignedUser?.email,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        });

        if (bmMatch) return bm;
        if (accounts.length) return { ...bm, accounts };
        return null;
      })
      .filter(Boolean);
  }, [data, query]);

  const summary = data?.summary;

  const handleAssigned = () => {
    void fetchData();
    invalidate(queryKeys.admin.availableAdAccounts());
    invalidate(queryKeys.admin.metaAds());
  };

  return (
    <div className="space-y-5">
      <AssignAdAccountModal
        open={Boolean(assignTarget)}
        account={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={handleAssigned}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Available Ad Accounts</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Every ad account under each connected BM, with user assignment and live connection status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchData()}
          disabled={loading}
          className="admin-secondary-button inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-16 text-sm text-gray-500">
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
            <SummaryCard label="Ad accounts" value={summary?.totalAccounts ?? 0} hint="Across all BMs" accent="#0ea5e9" />
            <SummaryCard label="Assigned" value={summary?.assignedAccounts ?? 0} hint="Given to users" accent="#10b981" />
            <SummaryCard label="Unassigned" value={summary?.unassignedAccounts ?? 0} hint="No user linked" accent="#f59e0b" />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <Search size={14} className="text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search BM, Meta ID, account name, user, or status..."
                className="w-full bg-transparent text-sm text-gray-700 outline-none"
              />
            </div>
          </div>

          {filteredManagers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <Building2 size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">No matching ad accounts</p>
              <p className="mt-1 text-sm text-gray-500">Try another search or configure BM tokens in settings.</p>
              <Link href="/admin-dashboard/settings" className="mt-4 inline-flex text-xs font-bold text-sky-600 hover:underline">
                Open BM settings →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredManagers.map((bm, index) => (
                <BmSection
                  key={`${bm.businessId}-${bm.bmIndex}`}
                  bm={bm}
                  defaultOpen={index === 0 || Boolean(query)}
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
