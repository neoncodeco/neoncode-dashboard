"use client";

import { Loader2, UserRound, Wallet, X } from "lucide-react";
import { formatUsd } from "@/lib/currency";

export default function UserWalletRemainingBreakdownModal({ open, onClose, data, loading, error }) {
  if (!open) return null;

  const accounts = data?.accounts || [];
  const total = data?.totalRemaining ?? accounts.reduce((sum, item) => sum + (item.remaining || 0), 0);

  return (
    <div className="payment-proof-modal-root fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px]" aria-label="Close" onClick={onClose} />

      <div className="relative z-[96] flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Remaining balance</p>
            <h2 className="mt-1 text-xl font-black text-gray-900 sm:text-2xl">{formatUsd(total)}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {loading ? "Loading user balances..." : `${accounts.length} user${accounts.length === 1 ? "" : "s"} with balance`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-5 sm:px-6">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm font-semibold text-red-600">
              {error}
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center">
              <Wallet size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-gray-700">No remaining wallet balance found</p>
              <p className="mt-1 text-sm text-gray-500">Users will appear here after top-up and wallet credit.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const used = Math.max(0, Number(account.topup || 0) - Number(account.remaining || 0));

                return (
                  <div
                    key={account.userId}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-white to-emerald-50/30 transition hover:border-emerald-200"
                  >
                    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <UserRound size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">{account.name}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{account.email || account.userId}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:min-w-[320px]">
                        <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Top-up</p>
                          <p className="mt-1 text-sm font-bold text-gray-900">{formatUsd(account.topup)}</p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Used</p>
                          <p className="mt-1 text-sm font-bold text-amber-600">{formatUsd(used)}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Remaining</p>
                          <p className="mt-1 text-sm font-black text-emerald-700">{formatUsd(account.remaining)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
