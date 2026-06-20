"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  Layers,
  LayoutDashboard,
  Loader2,
  Mail,
  Save,
  User,
} from "lucide-react";
import useAppAuth from "@/hooks/useAppAuth";
import { formatUsd } from "@/lib/currency";
import { formatDate, statusPill } from "@/components/admin/userDetailShared";
import Swal from "sweetalert2";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AdminAdAccountDetailContext = createContext(null);

export function useAdminAdAccountDetail() {
  const ctx = useContext(AdminAdAccountDetailContext);
  if (!ctx) throw new Error("useAdminAdAccountDetail must be used within AdminAdAccountDetailShell");
  return ctx;
}

const TABS = [
  { slug: "", label: "Overview", icon: LayoutDashboard },
  { slug: "edit", label: "Edit", icon: Edit3 },
  { slug: "slots", label: "Slots", icon: Layers },
  { slug: "user", label: "User", icon: User },
];

export default function AdminAdAccountDetailShell({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useAppAuth();
  const requestId = String(params?.requestId || "");

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(null);

  const loadAccount = useCallback(async () => {
    if (!token || !requestId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ads-request/${encodeURIComponent(requestId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.message || "Failed to load ad account");
      setAccount(json.data);
      setLive({
        accountName: json.data.accountName || "Ad Account",
        status: json.data.status || "pending",
        userEmail: json.data.userEmail || json.data.linkedUser?.email || "",
        monthlyBudget: Number(json.data.monthlyBudget) || 0,
        bmId: json.data.bmId || "",
      });
    } catch (err) {
      await Swal.fire({
        title: "Not found",
        text: err.message || "Could not load this ad account.",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
      router.push("/admin-dashboard/meta-ads");
    } finally {
      setLoading(false);
    }
  }, [requestId, router, token]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const display = live || {
    accountName: account?.accountName || "Ad Account",
    status: account?.status || "pending",
    userEmail: account?.userEmail || "",
    monthlyBudget: Number(account?.monthlyBudget) || 0,
    bmId: account?.bmId || "",
  };

  const basePath = `/admin-dashboard/meta-ads/${encodeURIComponent(requestId)}`;
  const isEdit = pathname === `${basePath}/edit` || pathname.endsWith("/edit");
  const slotCount = account?.assignedAccounts?.length || 0;

  const contextValue = useMemo(
    () => ({ account, requestId, display, token, loadAccount, setLive }),
    [account, requestId, display, token, loadAccount]
  );

  if (loading || !account) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const statusClass = statusPill(display.status);

  return (
    <AdminAdAccountDetailContext.Provider value={contextValue}>
      <div className="mx-auto max-w-6xl space-y-5 pb-10">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin-dashboard/meta-ads"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Meta Ads
          </Link>
          {isEdit ? (
            <button
              type="submit"
              form="ad-account-edit-form"
              className="admin-accent-button inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
            >
              <Save size={15} />
              Save
            </button>
          ) : null}
        </div>

        {/* Profile header — compact, not card stack */}
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white">
              <Layers size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-black text-gray-900 sm:text-xl">{display.accountName}</h1>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass}`}>
                  {display.status}
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                <Mail size={13} className="text-gray-400" />
                {display.userEmail || "No email"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 border-t border-gray-100 pt-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500">BM ID</span>
              <span className="truncate font-mono text-xs font-semibold text-gray-900">{display.bmId || account.bmId || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500">Meta ID</span>
              <span className="truncate font-mono text-xs font-semibold text-gray-900">{account.MetaAccountID || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500">Budget</span>
              <span className="font-bold text-emerald-700">{formatUsd(display.monthlyBudget)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-500">Created</span>
              <span className="font-semibold text-gray-900">{account.createdAt ? formatDate(account.createdAt) : "—"}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-100/80 p-1">
          {TABS.map((tab) => {
            if (tab.slug === "user" && !account.userUid) return null;
            if (tab.slug === "slots" && slotCount <= 1) return null;

            const href = tab.slug ? `${basePath}/${tab.slug}` : basePath;
            const active = tab.slug ? pathname === href || pathname.endsWith(`/${tab.slug}`) : pathname === basePath;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.slug || "overview"}
                href={href}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon size={15} />
                {tab.label}
                {tab.slug === "slots" && slotCount > 1 ? (
                  <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">{slotCount}</span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </AdminAdAccountDetailContext.Provider>
  );
}
