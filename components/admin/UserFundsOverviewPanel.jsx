"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowUpRight, Clock, CreditCard, Layers, UserRound, Wallet } from "lucide-react";
import { formatUsd } from "@/lib/currency";
import useAppAuth from "@/hooks/useAppAuth";
import UserWalletRemainingBreakdownModal from "@/components/admin/UserWalletRemainingBreakdownModal";

function FundStatCard({ label, value, hint, icon: Icon, accent, clickable, onClick }) {
  const Tag = clickable ? "button" : "div";

  return (
    <Tag
      type={clickable ? "button" : undefined}
      onClick={onClick}
      className={`w-full rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-0.5 ${
        clickable ? "cursor-pointer hover:border-emerald-200 hover:shadow-md" : ""
      }`}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl p-2" style={{ background: `${accent}18` }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{hint}</p>
    </Tag>
  );
}

function pendingTypeMeta(type) {
  switch (type) {
    case "payment":
      return { label: "Payment", icon: CreditCard, className: "text-amber-700 bg-amber-50 border-amber-200" };
    case "ad_request":
      return { label: "Ad request", icon: Layers, className: "text-sky-700 bg-sky-50 border-sky-200" };
    case "user_approval":
      return { label: "User signup", icon: UserRound, className: "text-violet-700 bg-violet-50 border-violet-200" };
    default:
      return { label: "Pending", icon: Clock, className: "text-gray-700 bg-gray-50 border-gray-200" };
  }
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

export default function UserFundsOverviewPanel({ funds, pending, loading }) {
  const { token } = useAppAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState("");
  const [breakdown, setBreakdown] = useState(null);

  const totalTopup = Number(funds?.totalTopup || 0);
  const totalUsed = Number(funds?.totalUsed || 0);
  const totalRemaining = Number(funds?.totalRemaining || 0);
  const userCount = Number(funds?.userCount || 0);
  const pendingItems = Array.isArray(pending?.items) ? pending.items : [];
  const pendingTotal = Number(pending?.total || pendingItems.length || 0);

  const openRemainingBreakdown = useCallback(async () => {
    if (!token) return;
    setModalOpen(true);
    setBreakdownLoading(true);
    setBreakdownError("");
    try {
      const res = await fetch("/api/admin/stats/user-wallet-breakdown", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Could not load user balances.");
      setBreakdown(json);
    } catch (err) {
      setBreakdownError(err.message || "Could not load user balances.");
      setBreakdown(null);
    } finally {
      setBreakdownLoading(false);
    }
  }, [token]);

  if (loading && !funds) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="admin-skeleton mb-3 h-8 w-8 rounded-xl" />
              <div className="admin-skeleton h-3 w-24 rounded-full" />
              <div className="admin-skeleton mt-2 h-8 w-28 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="admin-skeleton h-4 w-40 rounded-full" />
          <div className="admin-skeleton mt-4 h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <UserWalletRemainingBreakdownModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={breakdown}
        loading={breakdownLoading}
        error={breakdownError}
      />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-black tracking-tight text-gray-900">User wallet summary</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Combined top-up, used, and remaining balance across {userCount} user{userCount === 1 ? "" : "s"}
          </p>
        </div>
        <span className="text-xs font-semibold text-gray-400">All-time totals · USD</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <FundStatCard
          label="Total top-up"
          value={formatUsd(totalTopup)}
          hint="All credited top-up balance"
          icon={CreditCard}
          accent="#8b5cf6"
        />
        <FundStatCard
          label="Total used"
          value={formatUsd(totalUsed)}
          hint="Spent from wallet across users"
          icon={ArrowUpRight}
          accent="#f59e0b"
        />
        <FundStatCard
          label="Remaining balance"
          value={formatUsd(totalRemaining)}
          hint="Click for user breakdown"
          icon={Wallet}
          accent="#10b981"
          clickable
          onClick={openRemainingBreakdown}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-black text-gray-900">Pending items</h4>
            <p className="mt-0.5 text-xs text-gray-500">
              {pendingTotal} item{pendingTotal === 1 ? "" : "s"} waiting for review
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
              Payments {pending?.counts?.payments || 0}
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700">
              Ad requests {pending?.counts?.adRequests || 0}
            </span>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-violet-700">
              Signups {pending?.counts?.userApprovals || 0}
            </span>
          </div>
        </div>

        {pendingItems.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">No pending items right now.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingItems.map((item) => {
              const meta = pendingTypeMeta(item.type);
              const Icon = meta.icon;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-gray-50/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.className}`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${meta.className}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          {formatWhen(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-bold text-gray-900">{item.title}</p>
                      <p className="truncate text-xs text-gray-500">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-black text-gray-900">{item.amountLabel || "—"}</p>
                      {item.amountSecondary ? (
                        <p className="text-xs text-gray-400">{item.amountSecondary}</p>
                      ) : null}
                    </div>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-sky-600 transition hover:bg-sky-50"
                      >
                        Review
                        <ArrowUpRight size={13} />
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
