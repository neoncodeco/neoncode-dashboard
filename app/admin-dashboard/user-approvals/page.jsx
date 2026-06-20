"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
import useAppAuth from "@/hooks/useAppAuth";
import Swal from "sweetalert2";

const FILTERS = [
  { id: "pending", label: "Pending" },
  { id: "active", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "inactive", label: "Blocked" },
  { id: "all", label: "All" },
];

function statusStyle(status) {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-red-50 text-red-600 border-red-200";
    case "inactive":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function UserApprovalsPage() {
  const { token } = useAppAuth();
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/user-approvals?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load requests");
      setRows(json.rows || []);
      setCounts(json.counts || {});
    } catch (err) {
      await Swal.fire("Error", err.message || "Could not load approval requests.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, search, token]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const pendingCount = counts.pending || 0;

  const runAction = async (userId, action) => {
    const labels = {
      approve: "approve this user",
      reject: "reject this registration",
      block: "block this user",
      delete: "permanently delete this user",
    };

    const confirm = await Swal.fire({
      title: `Confirm ${action}?`,
      text: `Are you sure you want to ${labels[action] || action}?`,
      icon: action === "delete" ? "warning" : "question",
      input: action === "reject" || action === "block" ? "text" : undefined,
      inputPlaceholder: "Optional note for admin",
      showCancelButton: true,
      confirmButtonColor: action === "delete" || action === "reject" ? "#dc2626" : "#2563eb",
    });

    if (!confirm.isConfirmed) return;

    setActingId(userId);
    try {
      const res = await fetch("/api/admin/user-approvals", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, note: confirm.value || "" }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Action failed");
      await Swal.fire("Done", json.message || "Updated successfully.", "success");
      await load();
    } catch (err) {
      await Swal.fire("Error", err.message || "Action failed.", "error");
    } finally {
      setActingId("");
    }
  };

  const emptyMessage = useMemo(() => {
    if (filter === "pending") return "No pending registration requests.";
    return "No users found for this filter.";
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">User Approval Requests</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Review new registrations — approve, reject, block, or delete.
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4" style={{ borderLeft: "3px solid #f59e0b" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending</p>
          <p className="mt-1 text-2xl font-black text-amber-800">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Approved</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{counts.active || 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Rejected</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{counts.rejected || 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Blocked</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{counts.inactive || 0}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, user ID, referral..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                filter === item.id
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
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Email verified</th>
                <th className="p-4">Registered</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    Loading requests...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">{emptyMessage}</td>
                </tr>
              ) : (
                rows.map((row) => {
                  const busy = actingId === row.userId;
                  return (
                    <tr key={row.userId}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.photo || "https://i.ibb.co/kgp65LMf/profile-avater.png"}
                            alt={row.name}
                            className="h-10 w-10 rounded-xl border border-gray-200 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{row.name}</p>
                            <p className="font-mono text-[11px] text-gray-400">{row.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{row.email}</td>
                      <td className="p-4 capitalize text-gray-600">{row.authProvider}</td>
                      <td className="p-4">
                        {row.emailVerified ? (
                          <span className="text-emerald-600">Yes</span>
                        ) : (
                          <span className="text-amber-600">No</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">{formatDate(row.createdAt)}</td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusStyle(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          {row.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void runAction(row.userId, "approve")}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void runAction(row.userId, "reject")}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          ) : null}
                          {row.status === "active" ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void runAction(row.userId, "block")}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                              <Ban size={14} /> Block
                            </button>
                          ) : null}
                          {row.status === "inactive" || row.status === "rejected" ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void runAction(row.userId, "approve")}
                              className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                            >
                              <UserCheck size={14} /> Approve
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void runAction(row.userId, "delete")}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
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
        New signups start as <strong>pending</strong>. They must verify email and get admin approval before login.
        Existing users without a status field remain active.
      </p>
    </div>
  );
}
