"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Loader2,
  Percent,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";
import useAppAuth from "@/hooks/useAppAuth";
import Swal from "sweetalert2";

const SCOPES = [
  { id: "all", label: "All" },
  { id: "global", label: "Global" },
  { id: "user", label: "Users" },
  { id: "account", label: "Ad accounts" },
];

const OPERATIONS = [
  { id: "set", label: "Set to" },
  { id: "increase", label: "Increase by" },
  { id: "decrease", label: "Decrease by" },
  { id: "increase_percent", label: "Increase %" },
  { id: "decrease_percent", label: "Decrease %" },
];

function typeBadge(type) {
  switch (type) {
    case "global":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "user":
      return "bg-sky-50 text-sky-700 border-sky-200";
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

function rowKey(row) {
  return `${row.type}:${row.id}`;
}

export default function DollarRatesPage() {
  const { token } = useAppAuth();
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [globalRate, setGlobalRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [operation, setOperation] = useState("increase");
  const [bulkValue, setBulkValue] = useState("1");
  const [bulkScope, setBulkScope] = useState("filtered");
  const [selected, setSelected] = useState({});
  const [draftRates, setDraftRates] = useState({});

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (scope !== "all") params.set("scope", scope);
      const res = await fetch(`/api/admin/dollar-rates?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load rates");
      setRows(json.rows || []);
      setCounts(json.counts || {});
      setGlobalRate(json.globalRate || 0);
      const nextDraft = {};
      for (const row of json.rows || []) {
        nextDraft[rowKey(row)] = String(row.rate);
      }
      setDraftRates(nextDraft);
    } catch (err) {
      await Swal.fire("Error", err.message || "Could not load dollar rates.", "error");
    } finally {
      setLoading(false);
    }
  }, [search, scope, token]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const allSelected = useMemo(() => {
    if (!rows.length) return false;
    return rows.every((row) => selected[rowKey(row)]);
  }, [rows, selected]);

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
      return;
    }
    const next = {};
    for (const row of rows) next[rowKey(row)] = true;
    setSelected(next);
  };

  const toggleRow = (row) => {
    const key = rowKey(row);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const saveRow = async (row) => {
    const key = rowKey(row);
    const rate = Number(draftRates[key]);
    if (!Number.isFinite(rate) || rate <= 0) {
      await Swal.fire("Invalid rate", "Enter a rate greater than 0.", "warning");
      return;
    }

    setSavingId(key);
    try {
      const res = await fetch("/api/admin/dollar-rates", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: row.type, id: row.id, rate }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Save failed");
      await load();
      Swal.fire({ title: "Saved", icon: "success", timer: 1200, showConfirmButton: false });
    } catch (err) {
      await Swal.fire("Error", err.message || "Could not save rate.", "error");
    } finally {
      setSavingId("");
    }
  };

  const runBulk = async () => {
    const value = Number(bulkValue);
    if (!Number.isFinite(value)) {
      await Swal.fire("Invalid value", "Enter a valid number.", "warning");
      return;
    }

    const selectedItems = Object.keys(selected)
      .filter((key) => selected[key])
      .map((key) => {
        const [type, ...idParts] = key.split(":");
        return { type, id: idParts.join(":") };
      });

    const useSelected = bulkScope === "selected";
    if (useSelected && selectedItems.length === 0) {
      await Swal.fire("No selection", "Select at least one row first.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Apply bulk rate change?",
      text: useSelected
        ? `Update ${selectedItems.length} selected item(s).`
        : `Update all ${rows.length} filtered result(s).`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
    });
    if (!confirm.isConfirmed) return;

    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/dollar-rates/bulk", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          value,
          scope: useSelected ? "selected" : bulkScope,
          search: search.trim(),
          selected: selectedItems,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Bulk update failed");

      const s = json.summary || {};
      await Swal.fire(
        "Bulk update done",
        `Updated ${s.updated || 0} (global ${s.global || 0}, users ${s.users || 0}, accounts ${s.accounts || 0})`,
        "success"
      );
      setSelected({});
      await load();
    } catch (err) {
      await Swal.fire("Error", err.message || "Bulk update failed.", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Dollar Rate Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Control global, user, and ad account USD rates from one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4" style={{ borderLeft: "3px solid #6366f1" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Global rate</p>
          <p className="mt-1 text-2xl font-black text-gray-900">1 USD = {globalRate} BDT</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total entries</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{counts.all || 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Users</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{counts.users || 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ad accounts</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{counts.accounts || 0}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
          <DollarSign size={16} />
          Bulk update
        </h2>
        <div className="grid gap-3 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Operation</span>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            >
              {OPERATIONS.map((op) => (
                <option key={op.id} value={op.id}>{op.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Value</span>
            <input
              type="number"
              step="0.01"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Apply to</span>
            <select
              value={bulkScope}
              onChange={(e) => setBulkScope(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            >
              <option value="filtered">All filtered results</option>
              <option value="global">Global only</option>
              <option value="users">Users only (filtered)</option>
              <option value="accounts">Ad accounts only (filtered)</option>
              <option value="selected">Selected rows only</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void runBulk()}
              disabled={bulkLoading}
              className="admin-accent-button inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              {bulkLoading ? <Loader2 size={16} className="animate-spin" /> : <Percent size={16} />}
              Apply bulk
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, user ID, ad account, BM ID, Meta ID, rate..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setScope(item.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                scope === item.id
                  ? "border-sky-200 bg-sky-50 text-sky-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="p-4">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="p-4">Type</th>
                <th className="p-4">User / Label</th>
                <th className="p-4">Email</th>
                <th className="p-4">Ad account</th>
                <th className="p-4">BM ID</th>
                <th className="p-4">Meta ID</th>
                <th className="p-4">Rate (BDT)</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-gray-500">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    Loading rates...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-gray-500">No rates found for this search.</td>
                </tr>
              ) : (
                rows.map((row) => {
                  const key = rowKey(row);
                  return (
                    <tr key={key} className="text-gray-700">
                      <td className="p-4">
                        <input type="checkbox" checked={!!selected[key]} onChange={() => toggleRow(row)} />
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${typeBadge(row.type)}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-900">{row.userName || row.label}</p>
                        {row.userUid ? <p className="text-xs text-gray-400">{row.userUid}</p> : null}
                      </td>
                      <td className="p-4 text-gray-600">{row.userEmail || "—"}</td>
                      <td className="p-4">{row.accountName || "—"}</td>
                      <td className="p-4 font-mono text-xs">{row.bmId || "—"}</td>
                      <td className="p-4 font-mono text-xs">{row.metaAccountId || "—"}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          value={draftRates[key] ?? row.rate}
                          onChange={(e) => setDraftRates((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-28 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-sky-400"
                        />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => void saveRow(row)}
                          disabled={savingId === key}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {savingId === key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Search matches name, email, user ID, account name, BM ID, Meta account ID, status, and rate value.
        Bulk changes apply to filtered rows unless you choose a specific scope or selected rows.
      </p>
    </div>
  );
}
