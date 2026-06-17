"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Plus,
  Save,
  Settings,
  User,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Wallet,
} from "lucide-react";
import useAppAuth from "@/hooks/useAppAuth";
import { useUserInsights } from "@/hooks/useUserInsights";
import Swal from "sweetalert2";

const DEFAULT_AVATAR = "https://i.ibb.co/kgp65LMf/profile-avater.png";

const AdminUserDetailContext = createContext(null);

export function useAdminUserDetail() {
  const ctx = useContext(AdminUserDetailContext);
  if (!ctx) throw new Error("useAdminUserDetail must be used within AdminUserDetailProvider");
  return ctx;
}

function formatUsd(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadge(status) {
  switch ((status || "active").toLowerCase()) {
    case "inactive":
      return { label: "Inactive", className: "bg-red-50 text-red-600 border border-red-100", icon: UserX };
    case "pending":
      return { label: "Pending", className: "bg-amber-50 text-amber-600 border border-amber-100", icon: Clock };
    default:
      return { label: "Active", className: "bg-emerald-50 text-emerald-600 border border-emerald-100", icon: UserCheck };
  }
}

function BalanceTile({ label, value, icon: Icon, accent }) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        <Icon size={14} style={{ color: accent }} />
        {label}
      </div>
      <p className="text-xl font-black tracking-tight text-gray-900">{formatUsd(value)}</p>
    </div>
  );
}

const TABS = [
  { slug: "", label: "Overview", icon: LayoutDashboard },
  { slug: "profile", label: "Profile", icon: User },
  { slug: "add-account", label: "Add Account", icon: Plus },
  { slug: "ad-accounts", label: "Ad Accounts", icon: Megaphone },
  { slug: "transactions", label: "Transactions", icon: CreditCard },
  { slug: "activity", label: "Activity", icon: Activity },
  { slug: "settings", label: "Settings", icon: Settings },
];

export default function AdminUserDetailShell({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useAppAuth();
  const userId = String(params?.userId || "");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(null);

  const { insights, loading: insightsLoading, refreshing, loadInsights } = useUserInsights(userId);

  const loadUser = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load user");
      setUser(json.user);
      setLive({
        name: json.user.name || "",
        email: json.user.email || "",
        role: json.user.role || "user",
        status: json.user.status || "active",
        walletBalance: Number(json.user.walletBalance) || 0,
        topupBalance: Number(json.user.topupBalance) || 0,
      });
    } catch (err) {
      await Swal.fire({
        title: "User not found",
        text: err.message || "Could not load this user.",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
      router.push("/admin-dashboard/users");
    } finally {
      setLoading(false);
    }
  }, [router, token, userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const display = live || {
    name: user?.name || "Unnamed",
    email: user?.email || "",
    role: user?.role || "user",
    status: user?.status || "active",
    walletBalance: Number(user?.walletBalance) || 0,
    topupBalance: Number(user?.topupBalance) || 0,
  };

  const totalFunds = useMemo(
    () => (Number(display.walletBalance) || 0) + (Number(display.topupBalance) || 0),
    [display.walletBalance, display.topupBalance]
  );

  const basePath = `/admin-dashboard/users/${encodeURIComponent(userId)}`;
  const isSettings = pathname === `${basePath}/settings` || pathname.endsWith("/settings");
  const isProfile = pathname === `${basePath}/profile` || pathname.endsWith("/profile");
  const saveFormId = isProfile ? "manage-user-profile-panel" : "manage-user-panel";

  const contextValue = useMemo(
    () => ({
      user,
      userId,
      display,
      token,
      insights,
      insightsLoading,
      refreshing,
      loadInsights,
      loadUser,
      setLive,
    }),
    [user, userId, display, token, insights, insightsLoading, refreshing, loadInsights, loadUser]
  );

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const status = statusBadge(display.status);

  return (
    <AdminUserDetailContext.Provider value={contextValue}>
      <div className="space-y-6 pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin-dashboard/users"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to users
          </Link>
          {isSettings || isProfile ? (
            <button
              type="submit"
              form={saveFormId}
              className="admin-accent-button inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
            >
              <Save size={16} />
              Save changes
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-sky-50/40 to-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={user.photo || DEFAULT_AVATAR}
                alt={display.name}
                className="h-16 w-16 rounded-2xl border-2 border-gray-200 object-cover shadow-sm"
              />
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">{display.name || "Unnamed"}</h1>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${status.className}`}>
                    <status.icon size={12} />
                    {status.label}
                  </span>
                  <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                    {display.role}
                  </span>
                </div>
                <p className="truncate text-sm text-gray-600">{display.email}</p>
                <p className="mt-1 font-mono text-[11px] text-gray-400">UID · {user.userId}</p>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 xl:max-w-xl">
              <BalanceTile label="Wallet" value={display.walletBalance} icon={Wallet} accent="#3b82f6" />
              <BalanceTile label="Topup" value={display.topupBalance} icon={CreditCard} accent="#8b5cf6" />
              <BalanceTile label="Total funds" value={totalFunds} icon={Shield} accent="#10b981" />
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const href = tab.slug ? `${basePath}/${tab.slug}` : basePath;
            const active = tab.slug
              ? pathname === href || pathname.endsWith(`/${tab.slug}`)
              : pathname === basePath;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.slug || "overview"}
                href={href}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </AdminUserDetailContext.Provider>
  );
}
