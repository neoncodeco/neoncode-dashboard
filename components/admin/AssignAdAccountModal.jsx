"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, UserRound, X } from "lucide-react";
import Swal from "sweetalert2";
import useAppAuth from "@/hooks/useAppAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import { queryKeys } from "@/lib/queryKeys";

export default function AssignAdAccountModal({ open, account, onClose, onAssigned }) {
  const { token } = useAppAuth();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: users = [], isLoading: usersLoading } = useApiQuery(
    queryKeys.admin.users(),
    "/api/admin/users-list",
    {
      enabled: open,
      select: (json) =>
        (Array.isArray(json.users) ? json.users : []).filter(
          (user) => user.userId && !["admin", "manager"].includes(String(user.role || "").toLowerCase())
        ),
    }
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.slice(0, 12);
    return users
      .filter((user) =>
        [user.name, user.email, user.userId, user.referralCode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 12);
  }, [search, users]);

  const selectedUser = users.find((user) => user.userId === selectedUserId) || null;
  const isReassign = Boolean(account?.isAssigned);

  if (!open || !account) return null;

  const handleAssign = async () => {
    if (!selectedUserId) {
      await Swal.fire({ icon: "warning", title: "Select a user", text: "Choose who should receive this ad account." });
      return;
    }

    if (!account.metaId) {
      await Swal.fire({ icon: "warning", title: "Missing Meta ID", text: "This account needs a Meta ID before assignment." });
      return;
    }

    if (isReassign) {
      const confirm = await Swal.fire({
        icon: "question",
        title: "Reassign ad account?",
        text: `This will move the account from ${account.assignedUser?.name || "current user"} to ${selectedUser?.name || selectedUser?.email || "selected user"}.`,
        showCancelButton: true,
        confirmButtonText: "Reassign",
        cancelButtonText: "Cancel",
      });
      if (!confirm.isConfirmed) return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/ads-request/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          metaId: account.metaId,
          requestId: account.requestId || "",
          accountName: account.accountName,
          bmId: account.bmId || "",
          userUid: selectedUserId,
          monthlyBudget: Number(monthlyBudget || account.monthlyBudget || 0),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || json?.message || "Assignment failed");

      await Swal.fire({
        icon: "success",
        title: isReassign ? "Reassigned" : "Assigned",
        text: json.message || "Ad account linked to user successfully.",
        timer: 1800,
        showConfirmButton: false,
      });

      setSearch("");
      setSelectedUserId("");
      setMonthlyBudget("");
      onAssigned?.(json.data);
      onClose?.();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Assignment failed",
        text: error.message || "Could not assign ad account.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="payment-proof-modal-root fixed inset-0 z-[96] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px]" aria-label="Close" onClick={onClose} />

      <div className="relative z-[97] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
              {isReassign ? "Reassign ad account" : "Assign ad account"}
            </p>
            <h2 className="mt-1 text-lg font-black text-gray-900">{account.accountName}</h2>
            <p className="mt-0.5 font-mono text-xs text-gray-500">Meta ID · {account.metaId || "—"}</p>
            {account.bmName ? <p className="mt-1 text-xs text-gray-500">BM · {account.bmName}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 overflow-auto px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Monthly budget (USD)
            </label>
            <input
              type="number"
              min="0"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              placeholder={account.monthlyBudget ? String(account.monthlyBudget) : "Optional"}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Select user
            </label>
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, or user ID..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="max-h-56 space-y-2 overflow-auto">
              {usersLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">No users found.</div>
              ) : (
                filteredUsers.map((user) => {
                  const active = selectedUserId === user.userId;
                  return (
                    <button
                      key={user.userId}
                      type="button"
                      onClick={() => setSelectedUserId(user.userId)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                        active ? "border-sky-300 bg-sky-50" : "border-gray-200 hover:border-sky-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                        <UserRound size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{user.name || "Unnamed"}</p>
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !selectedUserId}
            onClick={() => void handleAssign()}
            className="admin-accent-button rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {saving ? "Saving..." : isReassign ? "Reassign account" : "Assign account"}
          </button>
        </div>
      </div>
    </div>
  );
}
