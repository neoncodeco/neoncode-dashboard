"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronRight,
  CreditCard,
  History,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import Swal from "sweetalert2";
import { formatBdt, formatUsd } from "@/lib/currency";
import { formatPaymentMethod, formatStatusLabel } from "@/lib/displayFormatters";

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function statusPill(status) {
  const s = String(status || "pending").toLowerCase();
  if (["approved", "active", "success", "completed"].includes(s)) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (["rejected", "cancelled", "failed", "inactive"].includes(s)) {
    return "bg-red-50 text-red-600 border-red-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          {Icon ? <Icon size={18} className="text-gray-400" /> : null}
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatTile({ label, value, sub, onClick, active, accent = "#3b82f6" }) {
  const interactive = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`rounded-xl border px-4 py-3 text-left transition ${
        active
          ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100"
          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
      } ${interactive ? "cursor-pointer" : "cursor-default"}`}
      style={active ? { borderLeftWidth: 3, borderLeftColor: accent } : { borderLeftWidth: 3, borderLeftColor: "transparent" }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        {interactive ? (
          active ? <ChevronDown size={14} className="shrink-0 text-sky-600" /> : <ChevronRight size={14} className="shrink-0 text-gray-400" />
        ) : null}
      </div>
      <p className="mt-1 text-xl font-black text-gray-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-gray-500">{sub}</p> : null}
      {interactive ? <p className="mt-2 text-[10px] font-semibold text-sky-600">Click for details</p> : null}
    </button>
  );
}

export function InsightsLoader() {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
      <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
    </div>
  );
}

function DetailField({ label, value, mono }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-gray-900 ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

export function AccountDetailCard({ account, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <Megaphone size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-gray-900">{account.accountName}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(account.status)}`}>
              {formatStatusLabel(account.status)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {account.bmId ? `BM · ${account.bmId}` : "No BM ID"}
            {account.MetaAccountID ? ` · Meta · ${account.MetaAccountID}` : ""}
          </p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-xs text-gray-400">Spent</p>
          <p className="font-bold text-rose-600">
            {account.amountSpent != null ? formatUsd(account.amountSpent) : "—"}
          </p>
        </div>
        {open ? <ChevronDown size={18} className="shrink-0 text-gray-400" /> : <ChevronRight size={18} className="shrink-0 text-gray-400" />}
      </button>

      {open ? (
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Account name" value={account.accountName} />
            <DetailField label="Business Manager (BM) ID" value={account.bmId || "—"} mono />
            <DetailField label="Meta Account ID" value={account.MetaAccountID || "—"} mono />
            <DetailField label="Status" value={formatStatusLabel(account.status)} />
            <DetailField label="Monthly budget" value={formatUsd(account.monthlyBudget)} />
            <DetailField label="Spend cap" value={account.spendCap != null ? formatUsd(account.spendCap) : "—"} />
            <DetailField label="Amount spent" value={account.amountSpent != null ? formatUsd(account.amountSpent) : "—"} />
            <DetailField label="Remaining" value={account.remaining != null ? formatUsd(account.remaining) : "—"} />
            <DetailField label="Budget changes" value={formatUsd(account.budgetChanges || 0)} />
            <DetailField label="Currency" value={account.currency || "USD"} />
            <DetailField label="Created" value={formatDate(account.createdAt)} />
            <DetailField label="Request ID" value={account.id} mono />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OverviewDetailPanel({ title, children, onViewAll, viewAllHref }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {onViewAll && viewAllHref ? (
          <Link href={viewAllHref} className="text-xs font-semibold text-sky-600 hover:text-sky-700">
            View full page →
          </Link>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function UserOverviewPanel({ insights, userId }) {
  const [active, setActive] = useState(null);
  const basePath = userId ? `/admin-dashboard/users/${encodeURIComponent(userId)}` : "";

  const summary = insights?.summary || {
    adAccountCount: 0,
    totalSpent: 0,
    transactionCount: 0,
    activityCount: 0,
  };

  const toggle = (key) => setActive((prev) => (prev === key ? null : key));
  const accounts = insights?.adAccounts || [];
  const transactions = insights?.transactions || [];
  const activities = insights?.activities || [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Ad accounts"
          value={summary.adAccountCount}
          sub="Active & assigned"
          accent="#3b82f6"
          active={active === "accounts"}
          onClick={() => toggle("accounts")}
        />
        <StatTile
          label="Total spent"
          value={formatUsd(summary.totalSpent)}
          sub="From Meta (live)"
          accent="#ef4444"
          active={active === "spent"}
          onClick={() => toggle("spent")}
        />
        <StatTile
          label="Transactions"
          value={summary.transactionCount}
          sub="Payments on record"
          accent="#8b5cf6"
          active={active === "transactions"}
          onClick={() => toggle("transactions")}
        />
        <StatTile
          label="Activities"
          value={summary.activityCount}
          sub="Recent events"
          accent="#10b981"
          active={active === "activity"}
          onClick={() => toggle("activity")}
        />
      </div>

      {active === "accounts" ? (
        <OverviewDetailPanel title="Ad account details" viewAllHref={`${basePath}/ad-accounts`} onViewAll>
          {accounts.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">No ad accounts assigned yet.</p>
              <Link
                href={`${basePath}/add-account`}
                className="admin-accent-button inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
              >
                <Plus size={16} />
                Add ad account
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <AccountDetailCard key={`${account.id}-${account.MetaAccountID}`} account={account} defaultOpen={accounts.length === 1} />
              ))}
            </div>
          )}
        </OverviewDetailPanel>
      ) : null}

      {active === "spent" ? (
        <OverviewDetailPanel title="Spending breakdown" viewAllHref={`${basePath}/ad-accounts`} onViewAll>
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-500">No spending data — add an ad account first.</p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-500">Total spent (all accounts)</p>
                <p className="mt-1 text-2xl font-black text-rose-600">{formatUsd(summary.totalSpent)}</p>
              </div>
              {accounts.map((account) => (
                <AccountDetailCard key={`spent-${account.id}`} account={account} />
              ))}
            </div>
          )}
        </OverviewDetailPanel>
      ) : null}

      {active === "transactions" ? (
        <OverviewDetailPanel title="Transaction details" viewAllHref={`${basePath}/transactions`} onViewAll>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions for this user.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Method</th>
                    <th className="pb-3 pr-4">TRX ID</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 pr-4 text-gray-600">{formatDate(tx.createdAt)}</td>
                      <td className="py-3 pr-4 font-bold text-gray-900">{formatBdt(tx.amountBdt)}</td>
                      <td className="py-3 pr-4 text-gray-600">{formatPaymentMethod(tx.method)}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-500">{tx.trxId || "—"}</td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(tx.status)}`}>
                          {formatStatusLabel(tx.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </OverviewDetailPanel>
      ) : null}

      {active === "activity" ? (
        <OverviewDetailPanel title="Activity details" viewAllHref={`${basePath}/activity`} onViewAll>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.slice(0, 10).map((item) => {
                const isPayment = String(item.type).includes("PAYMENT");
                const isBudget = String(item.type).includes("META") || String(item.type).includes("BUDGET");
                const Icon = isPayment ? Wallet : isBudget ? ArrowUpRight : ArrowDownLeft;
                return (
                  <li key={item.id} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(item.status)}`}>
                          {formatStatusLabel(item.status)}
                        </span>
                      </div>
                      {item.description ? <p className="mt-0.5 text-xs text-gray-500">{item.description}</p> : null}
                      <p className="mt-1 text-[11px] text-gray-400">{formatDate(item.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </OverviewDetailPanel>
      ) : null}

      {!active ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-3 text-center text-xs text-gray-500">
          Click any card above to see full details · BM ID, Meta ID, spent & more
        </div>
      ) : null}
    </div>
  );
}

export function UserAddAccountPanel({ userId, userEmail, onAdded, token }) {
  const [newAccount, setNewAccount] = useState({
    accountName: "",
    bmId: "",
    MetaAccountID: "",
    monthlyBudget: "",
  });
  const [adding, setAdding] = useState(false);

  const addAdAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.accountName?.trim() && !newAccount.MetaAccountID?.trim()) {
      await Swal.fire("Missing info", "Account name or Meta Account ID is required.", "warning");
      return;
    }

    setAdding(true);
    try {
      const slot = {
        accountName: newAccount.accountName.trim() || "Manual Account",
        bmId: newAccount.bmId.trim(),
        MetaAccountID: newAccount.MetaAccountID.trim(),
        monthlyBudget: Number(newAccount.monthlyBudget || 0),
        userUid: userId,
        userEmail: userEmail || "",
        status: "active",
      };

      const res = await fetch("/api/admin/ads-request/approve", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...slot, assignedAccounts: [slot] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to add account");

      setNewAccount({ accountName: "", bmId: "", MetaAccountID: "", monthlyBudget: "" });
      await Swal.fire({ title: "Ad account added", icon: "success", timer: 1600, showConfirmButton: false });
      onAdded?.();
    } catch (err) {
      await Swal.fire("Error", err.message || "Could not add ad account.", "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <SectionCard title="Add Ad Account" icon={Plus}>
      <form onSubmit={addAdAccount} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Account name</span>
            <input
              value={newAccount.accountName}
              onChange={(e) => setNewAccount((p) => ({ ...p, accountName: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              placeholder="Brand Ads"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">BM ID</span>
            <input
              value={newAccount.bmId}
              onChange={(e) => setNewAccount((p) => ({ ...p, bmId: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              placeholder="Business manager ID"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Meta Account ID</span>
            <input
              value={newAccount.MetaAccountID}
              onChange={(e) => setNewAccount((p) => ({ ...p, MetaAccountID: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              placeholder="1234567890"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Monthly budget (USD)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newAccount.monthlyBudget}
              onChange={(e) => setNewAccount((p) => ({ ...p, monthlyBudget: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              placeholder="500"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Assigning to <span className="font-semibold text-gray-700">{userEmail || userId}</span>
          </p>
          <button
            type="submit"
            disabled={adding}
            className="admin-accent-button inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add account
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

export function UserAdAccountsPanel({ insights, refreshing, onRefresh }) {
  return (
    <SectionCard
      title="Ad Accounts"
      icon={Megaphone}
      action={
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      {(insights?.adAccounts || []).length === 0 ? (
        <p className="text-sm text-gray-500">No ad accounts assigned to this user yet.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Click any account to expand BM, Meta ID, budget & spend details.</p>
          {(insights?.adAccounts || []).map((account) => (
            <AccountDetailCard key={`${account.id}-${account.MetaAccountID}`} account={account} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function UserTransactionsPanel({ insights }) {
  return (
    <SectionCard title="Transactions" icon={CreditCard}>
      {(insights?.transactions || []).length === 0 ? (
        <p className="text-sm text-gray-500">No transactions for this user.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Method</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(insights?.transactions || []).map((tx) => (
                <tr key={tx.id}>
                  <td className="py-3 pr-4 text-gray-600">{formatDate(tx.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <span className="font-bold text-gray-900">{formatBdt(tx.amountBdt)}</span>
                    {tx.amountUsd > 0 ? (
                      <span className="ml-2 text-xs text-gray-400">({formatUsd(tx.amountUsd)})</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{formatPaymentMethod(tx.method)}</td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(tx.status)}`}>
                      {formatStatusLabel(tx.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

export function UserActivityPanel({ insights }) {
  return (
    <SectionCard title="Recent Activity" icon={Activity}>
      {(insights?.activities || []).length === 0 ? (
        <p className="text-sm text-gray-500">No activity recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {(insights?.activities || []).map((item) => {
            const isPayment = String(item.type).includes("PAYMENT");
            const isBudget = String(item.type).includes("META") || String(item.type).includes("BUDGET");
            const Icon = isPayment ? Wallet : isBudget ? ArrowUpRight : ArrowDownLeft;
            return (
              <li key={item.id} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(item.status)}`}>
                      {formatStatusLabel(item.status)}
                    </span>
                  </div>
                  {item.description ? <p className="mt-0.5 text-xs text-gray-500">{item.description}</p> : null}
                  <p className="mt-1 text-[11px] text-gray-400">{formatDate(item.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

function LimitChangeBadge({ amount }) {
  const value = Number(amount) || 0;
  const isIncrease = value > 0;
  const isDecrease = value < 0;
  const Icon = isDecrease ? ArrowDownRight : ArrowUpRight;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
        isIncrease
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : isDecrease
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-gray-200 bg-gray-50 text-gray-600"
      }`}
    >
      <Icon size={12} />
      {isIncrease ? "+" : ""}
      {formatUsd(Math.abs(value))}
      {isIncrease ? " increase" : isDecrease ? " decrease" : " no change"}
    </span>
  );
}

export function UserMetaAdsHistoryPanel({ insights }) {
  const [search, setSearch] = useState("");
  const logs = insights?.limitLogs || [];

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => String(log.adAccountId || "").toLowerCase().includes(q));
  }, [logs, search]);

  const stats = useMemo(() => {
    const totalIncrease = logs.reduce((sum, log) => {
      const change = Number(log.changeAmount) || 0;
      return change > 0 ? sum + change : sum;
    }, 0);
    const totalDecrease = logs.reduce((sum, log) => {
      const change = Number(log.changeAmount) || 0;
      return change < 0 ? sum + Math.abs(change) : sum;
    }, 0);
    const uniqueAccounts = new Set(logs.map((log) => log.adAccountId).filter(Boolean)).size;

    return {
      totalChanges: logs.length,
      totalIncrease,
      totalDecrease,
      uniqueAccounts,
      lastChange: logs[0]?.timestamp || null,
    };
  }, [logs]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total changes</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{stats.totalChanges}</p>
          <p className="mt-0.5 text-xs text-gray-500">Limit updates recorded</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ad accounts</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{stats.uniqueAccounts}</p>
          <p className="mt-0.5 text-xs text-gray-500">Unique Meta IDs touched</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total increased</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{formatUsd(stats.totalIncrease)}</p>
          <p className="mt-0.5 text-xs text-emerald-600/80">Sum of limit raises</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Last change</p>
          <p className="mt-1 text-sm font-bold text-gray-900">{stats.lastChange ? formatDate(stats.lastChange) : "—"}</p>
          <p className="mt-0.5 text-xs text-gray-500">Most recent update</p>
        </div>
      </div>

      <SectionCard
        title="Meta Ads History"
        icon={History}
        action={
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Meta account ID…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs font-medium outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 sm:w-48"
            />
          </div>
        }
      >
        {filteredLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center">
            <History size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">
              {search ? "No matching limit changes" : "No Meta ad limit changes yet"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {search
                ? "Try another Meta account ID."
                : "When this user updates ad spending limits, each change will appear here with date, time, and amount."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-white to-sky-50/30 transition hover:border-sky-200 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                      <Megaphone size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-bold text-gray-900">{log.adAccountId || "—"}</p>
                        <LimitChangeBadge amount={log.changeAmount} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-800">
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-500">{formatUsd(log.oldLimit)}</span>
                        <ArrowUpRight size={14} className="text-sky-500" />
                        <span className="rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 text-sky-700">
                          {formatUsd(log.newLimit)}
                        </span>
                      </div>
                      {(log.walletBefore != null || log.walletAfter != null) && (
                        <p className="mt-2 text-xs text-gray-500">
                          Wallet: {formatUsd(log.walletBefore ?? 0)} → {formatUsd(log.walletAfter ?? 0)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 lg:min-w-[200px]">
                    <Calendar size={16} className="shrink-0 text-gray-400" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleDateString(undefined, {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
