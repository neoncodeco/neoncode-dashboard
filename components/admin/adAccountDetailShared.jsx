"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Swal from "sweetalert2";
import { formatUsd } from "@/lib/currency";
import { formatDate, statusPill } from "@/components/admin/userDetailShared";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:max-w-md";

function DetailSurface({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {children}
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-5 py-3">
      <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">{title}</h2>
      {action}
    </div>
  );
}

export function InfoRow({ label, value, mono, children }) {
  return (
    <div className="grid gap-1 border-b border-gray-50 px-5 py-3.5 last:border-0 sm:grid-cols-[200px_1fr] sm:items-center sm:gap-6">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      {children ?? (
        <span className={`text-sm font-semibold text-gray-900 ${mono ? "break-all font-mono text-xs" : ""}`}>
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

function EditRow({ label, hint, children }) {
  return (
    <div className="grid gap-1.5 border-b border-gray-50 px-5 py-3.5 last:border-0 sm:grid-cols-[200px_1fr] sm:items-start sm:gap-6">
      <div className="pt-2">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        {hint ? <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SidebarMiniCard({ title, action, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">{title}</p>
        {action}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function SidebarField({ label, value, mono, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-500">{label}</p>
      {children ?? (
        <p className={`mt-1 text-sm font-bold text-gray-900 ${mono ? "break-all font-mono text-xs" : ""}`}>
          {value || "—"}
        </p>
      )}
    </div>
  );
}

export function AdAccountActionsSidebar({ account, onAction, saving, className = "" }) {
  const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition disabled:opacity-50";
  const slots = account?.assignedAccounts || [];
  const displaySlots =
    slots.length > 0
      ? slots
      : [
          {
            accountName: account?.accountName,
            bmId: account?.bmId,
            MetaAccountID: account?.MetaAccountID,
            monthlyBudget: account?.monthlyBudget,
            status: account?.status,
          },
        ];

  return (
    <aside className={`w-full shrink-0 lg:w-60 ${className}`}>
      <div className="space-y-3 lg:sticky lg:top-4">
        {/* Actions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</p>
          <div className="flex flex-wrap gap-2 lg:flex-col">
            <button
              type="button"
              disabled={saving}
              onClick={() => onAction?.("active")}
              className={`${btnBase} flex-1 bg-emerald-600 py-2.5 text-white hover:bg-emerald-700 lg:w-full lg:flex-none`}
            >
              <CheckCircle size={16} />
              Approve
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onAction?.("blocked")}
              className={`${btnBase} flex-1 border border-red-200 bg-red-50 py-2.5 text-red-600 hover:bg-red-600 hover:text-white lg:w-full lg:flex-none`}
            >
              <ShieldAlert size={16} />
              Block
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onAction?.("delete")}
              className={`${btnBase} flex-1 border border-gray-200 py-2.5 text-gray-600 hover:bg-gray-800 hover:text-white lg:w-full lg:flex-none`}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        {/* Assigned slots — small cards */}
        {displaySlots.map((slot, index) => (
              <SidebarMiniCard
                key={`${slot.MetaAccountID}-${index}`}
                title={displaySlots.length > 1 ? `Slot ${index + 1}` : "Assigned slot"}
                action={
                  displaySlots.length > 1 && index === 0 ? (
                    <Link
                      href={`/admin-dashboard/meta-ads/${encodeURIComponent(account._id)}/slots`}
                      className="text-[10px] font-bold text-sky-600 hover:text-sky-700"
                    >
                      Manage
                    </Link>
                  ) : null
                }
              >
                <SidebarField label="Name" value={slot.accountName} />
                <SidebarField label="BM ID" value={slot.bmId} mono />
                <SidebarField label="Meta ID" value={slot.MetaAccountID} mono />
                <SidebarField label="Budget" value={formatUsd(slot.monthlyBudget)} />
                <SidebarField label="Status">
                  <span className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase ${statusPill(slot.status)}`}>
                    {slot.status}
                  </span>
                </SidebarField>
              </SidebarMiniCard>
            ))}

        {/* Record — small card */}
        <SidebarMiniCard title="Record">
          <SidebarField label="Request ID" value={account?._id} mono />
          <SidebarField label="Created" value={account?.createdAt ? formatDate(account.createdAt) : "—"} />
          <SidebarField label="Last updated" value={account?.updatedAt ? formatDate(account.updatedAt) : "—"} />
        </SidebarMiniCard>
      </div>
    </aside>
  );
}

export function AdAccountOverviewPanel({ account, onAction, saving }) {
  const user = account?.linkedUser;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <AdAccountActionsSidebar account={account} onAction={onAction} saving={saving} className="lg:hidden" />
      <div className="min-w-0 flex-1">
        <DetailSurface>
          <SectionHeader title="Account information" />
          <InfoRow label="Account name" value={account?.accountName} />
          <InfoRow label="Status" value={account?.status} />
          <InfoRow label="Business Manager (BM) ID" value={account?.bmId} mono />
          <InfoRow label="Meta account ID" value={account?.MetaAccountID} mono />
          <InfoRow label="Monthly budget" value={formatUsd(account?.monthlyBudget)} />
          <InfoRow label="Timezone" value={account?.timezone || "BST"} />
          <InfoRow label="Facebook page" value={account?.facebookPage} />
          <InfoRow label="Contact email" value={account?.email} />
          <InfoRow label="Start date" value={account?.startDate} />
          <InfoRow label="Source" value={account?.source || "request"} />

          <SectionHeader title="Linked user" />
          {account?.userUid ? (
            <>
              <InfoRow label="User name" value={user?.name || "—"} />
              <InfoRow label="User email" value={account?.userEmail || user?.email} />
              <InfoRow label="User UID" value={account?.userUid} mono />
              <InfoRow label="Wallet balance" value={user?.walletBalance != null ? formatUsd(user.walletBalance) : "—"} />
              <div className="border-b border-gray-50 px-5 py-3.5">
                <Link
                  href={`/admin-dashboard/users/${encodeURIComponent(account.userUid)}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-sky-600 hover:text-sky-700"
                >
                  <ExternalLink size={14} />
                  Open user profile
                </Link>
              </div>
            </>
          ) : (
            <InfoRow label="Assignment" value="No user linked" />
          )}
        </DetailSurface>
      </div>

      <AdAccountActionsSidebar account={account} onAction={onAction} saving={saving} className="hidden lg:block" />
    </div>
  );
}

const STATUS_OPTIONS = ["pending", "active", "blocked", "rejected", "cancelled"];

export function AdAccountEditPanel({ account, token, formId = "ad-account-edit-form", onSaved, onLiveChange }) {
  const [saving, setSaving] = useState(false);

  const initial = useMemo(
    () => ({
      accountName: account?.accountName || "",
      bmId: account?.bmId || "",
      MetaAccountID: account?.MetaAccountID || "",
      monthlyBudget: Number(account?.monthlyBudget ?? 0),
      userUid: account?.userUid || "",
      userEmail: account?.userEmail || "",
      status: account?.status || "pending",
      timezone: account?.timezone || "BST",
      facebookPage: account?.facebookPage || "",
      email: account?.email || "",
      startDate: account?.startDate || "",
    }),
    [account]
  );

  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    onLiveChange?.({
      accountName: form.accountName,
      status: form.status,
      userEmail: form.userEmail,
      monthlyBudget: form.monthlyBudget,
      bmId: form.bmId,
    });
  }, [form.accountName, form.status, form.userEmail, form.monthlyBudget, form.bmId, onLiveChange]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!token || !account?._id) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/ads-request/approve", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: account._id,
          ...form,
          monthlyBudget: Number(form.monthlyBudget || 0),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Save failed");

      await Swal.fire({ title: "Saved", icon: "success", timer: 1400, showConfirmButton: false });
      onSaved?.();
    } catch (err) {
      await Swal.fire("Error", err.message || "Could not save.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form id={formId} onSubmit={submit}>
      <DetailSurface>
        <SectionHeader title="Account information" />
        <EditRow label="Account name">
          <input className={inputClass} value={form.accountName} onChange={(e) => setField("accountName", e.target.value)} />
        </EditRow>
        <EditRow label="Status">
          <select className={inputClass} value={form.status} onChange={(e) => setField("status", e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </EditRow>
        <EditRow label="Business Manager (BM) ID">
          <input className={`${inputClass} font-mono`} value={form.bmId} onChange={(e) => setField("bmId", e.target.value)} />
        </EditRow>
        <EditRow label="Meta account ID">
          <input className={`${inputClass} font-mono`} value={form.MetaAccountID} onChange={(e) => setField("MetaAccountID", e.target.value)} />
        </EditRow>
        <EditRow label="Monthly budget (USD)">
          <input type="number" className={inputClass} value={form.monthlyBudget} onChange={(e) => setField("monthlyBudget", e.target.value)} />
        </EditRow>
        <EditRow label="Timezone">
          <input className={inputClass} value={form.timezone} onChange={(e) => setField("timezone", e.target.value)} />
        </EditRow>
        <EditRow label="Facebook page">
          <input className={inputClass} value={form.facebookPage} onChange={(e) => setField("facebookPage", e.target.value)} />
        </EditRow>
        <EditRow label="Contact email">
          <input type="email" className={inputClass} value={form.email} onChange={(e) => setField("email", e.target.value)} />
        </EditRow>
        <EditRow label="Start date">
          <input className={inputClass} value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} />
        </EditRow>

        <SectionHeader title="User assignment" />
        <EditRow label="User UID">
          <input className={`${inputClass} font-mono`} value={form.userUid} onChange={(e) => setField("userUid", e.target.value)} />
        </EditRow>
        <EditRow label="User email">
          <input type="email" className={inputClass} value={form.userEmail} onChange={(e) => setField("userEmail", e.target.value)} />
        </EditRow>
        {form.userUid ? (
          <div className="border-b border-gray-50 px-5 py-3.5">
            <Link
              href={`/admin-dashboard/users/${encodeURIComponent(form.userUid)}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-sky-600 hover:text-sky-700"
            >
              <ExternalLink size={14} />
              View linked user profile
            </Link>
          </div>
        ) : null}

        <div className="flex justify-end border-t border-gray-100 px-5 py-4">
          <button
            type="submit"
            disabled={saving}
            className="admin-accent-button inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </DetailSurface>
    </form>
  );
}

export function AdAccountSlotsPanel({ account, token, onSaved }) {
  const slots = account?.assignedAccounts || [];
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(
      slots.length
        ? slots.map((s) => ({ ...s }))
        : [{
            accountName: account?.accountName || "",
            bmId: account?.bmId || "",
            MetaAccountID: account?.MetaAccountID || "",
            monthlyBudget: account?.monthlyBudget || 0,
            userUid: account?.userUid || "",
            userEmail: account?.userEmail || "",
            status: account?.status || "pending",
          }]
    );
  }, [account, slots]);

  const updateRow = (index, key, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, {
      accountName: "",
      bmId: "",
      MetaAccountID: "",
      monthlyBudget: 0,
      userUid: account?.userUid || "",
      userEmail: account?.userEmail || "",
      status: "pending",
    }]);
  };

  const removeRow = (index) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const save = async () => {
    if (!token || !account?._id) return;
    setSaving(true);
    try {
      const lead = rows[0] || {};
      const res = await fetch("/api/admin/ads-request/approve", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: account._id,
          assignedAccounts: rows,
          accountName: lead.accountName || account.accountName,
          bmId: lead.bmId,
          MetaAccountID: lead.MetaAccountID,
          monthlyBudget: Number(lead.monthlyBudget || 0),
          userUid: lead.userUid || account.userUid,
          userEmail: lead.userEmail || account.userEmail,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Save failed");
      await Swal.fire({ title: "Saved", icon: "success", timer: 1200, showConfirmButton: false });
      onSaved?.();
    } catch (err) {
      await Swal.fire("Error", err.message || "Could not save.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DetailSurface>
      <SectionHeader
        title="Assigned slots"
        action={
          <button type="button" onClick={addRow} className="text-xs font-bold text-sky-600 hover:text-sky-700">
            + Add slot
          </button>
        }
      />

      {rows.map((row, index) => (
        <div key={index}>
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-5 py-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Slot {index + 1}</span>
            {rows.length > 1 ? (
              <button type="button" onClick={() => removeRow(index)} className="text-xs font-bold text-red-500 hover:underline">
                Remove
              </button>
            ) : null}
          </div>
          <EditRow label="Account name">
            <input className={inputClass} value={row.accountName} onChange={(e) => updateRow(index, "accountName", e.target.value)} />
          </EditRow>
          <EditRow label="BM ID">
            <input className={`${inputClass} font-mono`} value={row.bmId} onChange={(e) => updateRow(index, "bmId", e.target.value)} />
          </EditRow>
          <EditRow label="Meta ID">
            <input className={`${inputClass} font-mono`} value={row.MetaAccountID} onChange={(e) => updateRow(index, "MetaAccountID", e.target.value)} />
          </EditRow>
          <EditRow label="Budget (USD)">
            <input type="number" className={inputClass} value={row.monthlyBudget} onChange={(e) => updateRow(index, "monthlyBudget", e.target.value)} />
          </EditRow>
          <EditRow label="Status">
            <select className={inputClass} value={row.status} onChange={(e) => updateRow(index, "status", e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </EditRow>
        </div>
      ))}

      <div className="flex justify-end border-t border-gray-100 px-5 py-4">
        <button type="button" disabled={saving} onClick={save} className="admin-accent-button rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60">
          {saving ? "Saving…" : "Save slots"}
        </button>
      </div>
    </DetailSurface>
  );
}

export function AdAccountUserPanel({ account }) {
  const user = account?.linkedUser;

  if (!account?.userUid) {
    return (
      <DetailSurface>
        <SectionHeader title="Linked user" />
        <InfoRow label="Status" value="No user assigned" />
        <div className="px-5 py-4">
          <Link
            href={`/admin-dashboard/meta-ads/${encodeURIComponent(account._id)}/edit`}
            className="text-sm font-bold text-sky-600 hover:text-sky-700"
          >
            Assign user in Edit tab →
          </Link>
        </div>
      </DetailSurface>
    );
  }

  return (
    <DetailSurface>
      <SectionHeader title="Linked user" />
      <InfoRow label="Name" value={user?.name || "—"} />
      <InfoRow label="Email" value={user?.email || account.userEmail} />
      <InfoRow label="User UID" value={account.userUid} mono />
      <InfoRow label="Role" value={user?.role || "—"} />
      <InfoRow label="Status" value={user?.status || "—"} />
      <InfoRow label="Wallet balance" value={user?.walletBalance != null ? formatUsd(user.walletBalance) : "—"} />
      <div className="px-5 py-4">
        <Link
          href={`/admin-dashboard/users/${encodeURIComponent(account.userUid)}`}
          className="admin-accent-button inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
        >
          <ExternalLink size={16} />
          Open full user profile
        </Link>
      </div>
    </DetailSurface>
  );
}
