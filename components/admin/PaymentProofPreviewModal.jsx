"use client";

import Image from "next/image";
import { Download, ExternalLink, Eye, X } from "lucide-react";
import { formatBdt } from "@/lib/currency";
import { formatPaymentMethod } from "@/lib/displayFormatters";

export default function PaymentProofPreviewModal({ payment, onClose }) {
  if (!payment) return null;

  const screenshotUrl = payment.screenshotUrl || payment.screenshot || "";
  const trxId = payment.trxId || payment.trx_id || "—";

  return (
    <div
      className="payment-proof-modal-root fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-proof-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px]"
        aria-label="Close preview"
        onClick={onClose}
      />

      <div className="relative z-[91] flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Payment Proof</p>
            <h2 id="payment-proof-title" className="mt-1 truncate text-lg font-black text-gray-900 sm:text-xl">
              {payment.userName || "Unknown User"}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                {formatPaymentMethod(payment.method)}
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                {formatBdt(payment.amountBdt ?? payment.amount)}
              </span>
              <span className="font-mono text-[11px] text-gray-400">TRX: {trxId}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-[linear-gradient(180deg,#f8fafc,#eef2f7)] p-4 sm:p-6">
          <div className="mx-auto flex min-h-[320px] max-w-4xl items-center justify-center rounded-[24px] border border-gray-200 bg-white p-3 shadow-inner sm:min-h-[420px] sm:p-4">
            {screenshotUrl ? (
              <div className="relative h-full w-full min-h-[280px] sm:min-h-[380px]">
                <Image
                  src={screenshotUrl}
                  alt={`Bank payment proof for ${payment.userName || "user"}`}
                  fill
                  unoptimized
                  className="rounded-[18px] object-contain"
                  sizes="(max-width: 1024px) 100vw, 960px"
                />
              </div>
            ) : (
              <p className="text-sm font-medium text-gray-400">No screenshot available for this payment.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs leading-5 text-gray-500">
            Review the uploaded transaction screenshot before approving or rejecting this bank payment.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {screenshotUrl ? (
              <>
                <a
                  href={screenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="payment-proof-btn-secondary inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:bg-gray-50"
                >
                  <ExternalLink size={15} />
                  Open original
                </a>
                <a
                  href={screenshotUrl}
                  download
                  className="payment-proof-btn-download inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:brightness-[0.98]"
                >
                  <Download size={15} />
                  Download
                </a>
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="payment-proof-btn-close inline-flex items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function isBankTransferPayment(payment) {
  const method = String(payment?.method || "").toLowerCase();
  return method === "bank_transfer" || method === "bank" || method === "manual";
}

function getPaymentScreenshot(payment) {
  return payment?.screenshotUrl || payment?.screenshot || "";
}

export function PaymentProofField({ payment, onPreview }) {
  const screenshotUrl = getPaymentScreenshot(payment);
  const isBank = isBankTransferPayment(payment);
  const trxId = payment?.trxId || payment?.trx_id || "";

  if (!isBank) {
    return <span className="text-xs font-medium text-gray-300">—</span>;
  }

  if (!screenshotUrl) {
    return (
      <span className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
        No screenshot
      </span>
    );
  }

  return (
    <div className="flex min-w-[220px] max-w-[280px] items-center gap-2">
      <input
        type="text"
        readOnly
        value={trxId || "Screenshot attached"}
        title={trxId || "Bank payment screenshot"}
        className="h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700 outline-none"
      />
      <button
        type="button"
        onClick={() => onPreview(payment)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
        aria-label="View payment screenshot"
        title="View screenshot"
      >
        <Eye size={18} />
      </button>
    </div>
  );
}
