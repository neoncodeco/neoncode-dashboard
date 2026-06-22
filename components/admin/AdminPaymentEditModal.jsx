"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, History, Loader2, Save, X } from "lucide-react";
import Swal from "sweetalert2";
import { convertBdtToUsd, convertUsdToBdt, formatBdt, formatUsd } from "@/lib/currency";
import { formatPaymentMethod, formatStatusLabel } from "@/lib/displayFormatters";
import { serializeMongoId } from "@/lib/serializeMongoId";

const SWAL_PRIMARY = { confirmButtonColor: "#2563eb", cancelButtonColor: "#6b7280" };

function roundUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return String(Math.round(n * 10000) / 10000);
}

function resolvePaymentId(payment) {
  if (!payment) return "";
  return serializeMongoId(payment.id ?? payment._id);
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function toInputDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

function HistoryItem({ entry }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900">{entry.adminName || "Admin"}</p>
          <p className="text-xs text-gray-500">{entry.adminEmail || entry.adminUid}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={13} />
          {formatDateTime(entry.createdAt)}
        </div>
      </div>
      {entry.walletDelta ? (
        <p className="mt-2 text-xs font-semibold text-sky-700">
          Wallet sync: {entry.walletDelta > 0 ? "+" : ""}
          {formatUsd(entry.walletDelta)}
        </p>
      ) : null}
      <div className="mt-3 space-y-2">
        {(entry.changes || []).map((change, index) => (
          <div key={`${change.field}-${index}`} className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs">
            <p className="font-bold uppercase tracking-wide text-gray-400">{change.field}</p>
            <p className="mt-1 text-gray-500">
              <span className="line-through">{String(change.from ?? "—")}</span>
              <span className="mx-2 text-sky-500">→</span>
              <span className="font-semibold text-gray-900">{String(change.to ?? "—")}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPaymentEditModal({ payment, token, onClose, onSaved }) {
  const [tab, setTab] = useState("edit");
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [syncSource, setSyncSource] = useState("bdt");

  const [form, setForm] = useState({
    amountBdt: "",
    creditedUsdAmount: "",
    usdToBdtRate: "",
    method: "bank_transfer",
    status: "pending",
    trxId: "",
    screenshotUrl: "",
    createdAt: "",
  });

  useEffect(() => {
    if (!payment) return;
    setForm({
      amountBdt: String(payment.amountBdt ?? payment.amount ?? ""),
      creditedUsdAmount: String(payment.creditedUsdAmount ?? ""),
      usdToBdtRate: String(payment.usdToBdtRate ?? ""),
      method: payment.method || "bank_transfer",
      status: payment.status || "pending",
      trxId: payment.trxId || payment.trx_id || "",
      screenshotUrl: payment.screenshotUrl || payment.screenshot || "",
      createdAt: toInputDateTime(payment.createdAt),
    });
    setTab("edit");
    setHistory([]);
    setSyncSource("bdt");
  }, [payment]);

  const rateNumber = Number(form.usdToBdtRate);

  const updateBdt = (value) => {
    setSyncSource("bdt");
    setForm((prev) => {
      const next = { ...prev, amountBdt: value };
      const bdt = Number(value);
      const rate = Number(prev.usdToBdtRate);
      if (Number.isFinite(bdt) && bdt > 0 && Number.isFinite(rate) && rate > 0) {
        next.creditedUsdAmount = roundUsd(convertBdtToUsd(bdt, rate));
      }
      return next;
    });
  };

  const updateUsd = (value) => {
    setSyncSource("usd");
    setForm((prev) => {
      const next = { ...prev, creditedUsdAmount: value };
      const usd = Number(value);
      const rate = Number(prev.usdToBdtRate);
      if (Number.isFinite(usd) && usd > 0 && Number.isFinite(rate) && rate > 0) {
        next.amountBdt = String(Math.round(convertUsdToBdt(usd, rate)));
      }
      return next;
    });
  };

  const updateRate = (value) => {
    setForm((prev) => {
      const next = { ...prev, usdToBdtRate: value };
      const rate = Number(value);
      if (!Number.isFinite(rate) || rate <= 0) return next;

      if (syncSource === "usd") {
        const usd = Number(prev.creditedUsdAmount);
        if (Number.isFinite(usd) && usd > 0) {
          next.amountBdt = String(Math.round(convertUsdToBdt(usd, rate)));
        }
      } else {
        const bdt = Number(prev.amountBdt);
        if (Number.isFinite(bdt) && bdt > 0) {
          next.creditedUsdAmount = roundUsd(convertBdtToUsd(bdt, rate));
        }
      }
      return next;
    });
  };

  const previewBdt = useMemo(() => {
    const bdt = Number(form.amountBdt);
    if (Number.isFinite(bdt) && bdt > 0) return Math.round(bdt);
    const usd = Number(form.creditedUsdAmount);
    if (Number.isFinite(usd) && usd > 0 && Number.isFinite(rateNumber) && rateNumber > 0) {
      return Math.round(convertUsdToBdt(usd, rateNumber));
    }
    return 0;
  }, [form.amountBdt, form.creditedUsdAmount, rateNumber]);

  const previewUsd = useMemo(() => {
    const usd = Number(form.creditedUsdAmount);
    if (Number.isFinite(usd) && usd > 0) return usd;
    const bdt = Number(form.amountBdt);
    if (Number.isFinite(bdt) && bdt > 0 && Number.isFinite(rateNumber) && rateNumber > 0) {
      return convertBdtToUsd(bdt, rateNumber);
    }
    return 0;
  }, [form.amountBdt, form.creditedUsdAmount, rateNumber]);

  const loadHistory = async () => {
    const paymentId = resolvePaymentId(payment);
    if (!paymentId || !token) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/payments/edit-history?paymentId=${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) setHistory(json.history || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (tab === "history" && resolvePaymentId(payment)) void loadHistory();
  }, [tab, payment]);

  const handleSave = async () => {
    const confirm = await Swal.fire({
      title: "Save payment changes?",
      html: "This will update the transaction everywhere and sync user wallet/topup if needed.<br/><span style='font-size:13px;color:#6b7280'>Admin edit history will be stored privately.</span>",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save changes",
      cancelButtonText: "Cancel",
      ...SWAL_PRIMARY,
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    const paymentId = resolvePaymentId(payment);
    if (!paymentId) {
      await Swal.fire({
        icon: "error",
        title: "Save failed",
        text: "Payment ID is missing. Refresh the page and try again.",
        ...SWAL_PRIMARY,
      });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/payments/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId,
          amountBdt: Math.round(Number(form.amountBdt) || previewBdt),
          creditedUsdAmount: Number(form.creditedUsdAmount) || previewUsd,
          usdToBdtRate: Number(form.usdToBdtRate) || undefined,
          method: form.method,
          status: form.status,
          trxId: form.trxId,
          screenshotUrl: form.screenshotUrl,
          createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Could not save payment.");

      await Swal.fire({
        icon: "success",
        title: "Payment updated",
        text: json.message || "Changes saved and balances synced.",
        timer: 1800,
        showConfirmButton: false,
      });
      onSaved?.(json.payment);
      onClose();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Save failed",
        text: error.message || "Could not update payment.",
        ...SWAL_PRIMARY,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!payment) return null;

  return (
    <div className="payment-proof-modal-root fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px]" aria-label="Close" onClick={onClose} />

      <div className="relative z-[96] flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Edit transaction</p>
            <h2 className="mt-1 truncate text-lg font-black text-gray-900 sm:text-xl">{payment.userName || "Unknown user"}</h2>
            <p className="mt-1 font-mono text-[11px] text-gray-400">Payment · {resolvePaymentId(payment) || "—"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 border-b border-gray-100 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "edit" ? "bg-sky-50 text-sky-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Edit details
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "history" ? "bg-sky-50 text-sky-700" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <History size={15} />
            Admin history
            {(payment.editHistoryCount || 0) > 0 ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                {payment.editHistoryCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-5 sm:px-6">
          {tab === "edit" ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount (BDT)" hint={`Synced: ${formatBdt(previewBdt)}`}>
                  <input
                    type="number"
                    min="1"
                    value={form.amountBdt}
                    onChange={(e) => updateBdt(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </Field>
                <Field label="Credited USD" hint={`Synced: ${formatUsd(previewUsd)}`}>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={form.creditedUsdAmount}
                    onChange={(e) => updateUsd(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </Field>
                <Field label="USD to BDT rate" hint="Changing rate updates BDT or USD based on last edited field">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.usdToBdtRate}
                    onChange={(e) => updateRate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </Field>
                <Field label="Payment method">
                  <select
                    value={form.method}
                    onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="uddoktapay">UddoktaPay</option>
                    <option value="online">Online</option>
                    <option value="manual">Manual</option>
                  </select>
                </Field>
                <Field label="Transaction date">
                  <input
                    type="datetime-local"
                    value={form.createdAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, createdAt: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </Field>
              </div>

              <Field label="Transaction / TRX ID">
                <input
                  value={form.trxId}
                  onChange={(e) => setForm((prev) => ({ ...prev, trxId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Proof screenshot URL">
                <input
                  value={form.screenshotUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, screenshotUrl: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-amber-800">
                Approved payment edits automatically adjust the user&apos;s wallet and topup balances. Users cannot see admin edit history.
              </div>
            </div>
          ) : loadingHistory ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center">
              <History size={30} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">No admin edits yet</p>
              <p className="mt-1 text-sm text-gray-500">Changes made by admins will appear here privately.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <HistoryItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-gray-500">
            Current: {formatBdt(form.amountBdt)} · {formatPaymentMethod(form.method)} · {formatStatusLabel(form.status)}
          </p>
          {tab === "edit" ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="admin-accent-button inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save changes
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
