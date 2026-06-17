"use client";

import { useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import Swal from "sweetalert2";
import { formatBdt, formatUsd, DEFAULT_USD_TO_BDT_RATE } from "@/lib/currency";

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

export function StatTile({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-black text-gray-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-gray-500">{sub}</p> : null}
    </div>
  );
}

export function InsightsLoader() {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
      <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
    </div>
  );
}

export function UserOverviewPanel({ insights }) {
  const summary = insights?.summary || {
    adAccountCount: 0,
    totalSpent: 0,
    transactionCount: 0,
    activityCount: 0,
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Ad accounts" value={summary.adAccountCount} sub="Active & assigned" />
      <StatTile label="Total spent" value={formatUsd(summary.totalSpent)} sub="From Meta (live)" />
      <StatTile label="Transactions" value={summary.transactionCount} sub="Payments on record" />
      <StatTile label="Activities" value={summary.activityCount} sub="Recent events" />
    </div>
  );
}

export function UserAddAccountPanel({ userId, userEmail, usdToBdtRate, onAdded, token }) {
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
        usdToBdtRate: Number(usdToBdtRate || DEFAULT_USD_TO_BDT_RATE),
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="pb-3 pr-4">Account</th>
                <th className="pb-3 pr-4">Meta ID</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Budget</th>
                <th className="pb-3 pr-4">Spent</th>
                <th className="pb-3">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(insights?.adAccounts || []).map((account) => (
                <tr key={`${account.id}-${account.MetaAccountID}`} className="text-gray-700">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-gray-900">{account.accountName}</p>
                    {account.bmId ? <p className="text-xs text-gray-400">BM · {account.bmId}</p> : null}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">{account.MetaAccountID || "—"}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(account.status)}`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-semibold">{formatUsd(account.monthlyBudget)}</td>
                  <td className="py-3 pr-4 font-semibold text-rose-600">
                    {account.amountSpent != null ? formatUsd(account.amountSpent) : "—"}
                  </td>
                  <td className="py-3 font-semibold text-emerald-600">
                    {account.remaining != null ? formatUsd(account.remaining) : "—"}
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
                  <td className="py-3 pr-4 capitalize text-gray-600">
                    {tx.method === "bank_transfer" ? "Bank transfer" : "Online"}
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(tx.status)}`}>
                      {tx.status}
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
                      {item.status}
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
