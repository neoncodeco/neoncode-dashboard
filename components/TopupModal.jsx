"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { userDashboardRoutes } from "@/lib/userDashboardRoutes";

export default function TopupModal({ open, onClose }) {
  const router = useRouter();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-transparent px-4 text-black backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.995),rgba(250,252,255,0.98))] p-6 text-slate-900 shadow-[0_30px_80px_-28px_rgba(15,23,42,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-emerald-100/70 blur-3xl" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <X size={16} />
        </button>

        <div className="relative mb-5 pr-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-600">Wallet required</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Wallet balance is too low</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Top up your wallet first, then come back to continue running ads or increasing budget safely.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push(userDashboardRoutes.billing)}
          className="flex w-full justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#14b8a6)] py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(14,165,233,0.22)] transition hover:brightness-105"
        >
          Open Billing
        </button>
      </div>
    </div>
  );
}
