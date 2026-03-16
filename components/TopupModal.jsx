"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TopupModal({ open, onClose }) {
  const router = useRouter();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 text-black backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(15,29,56,0.98),rgba(9,18,38,0.98))] p-6 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.95)]">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>

        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Wallet Required</p>
        <h3 className="mb-3 mt-2 text-2xl font-black">Wallet balance is too low</h3>
        <p className="mb-5 text-sm text-slate-400">
          Top up your wallet first, then come back to continue running ads or increasing budget safely.
        </p>

        <button
          onClick={() => router.push("/user-dashboard/payment-methods")}
          className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-black text-white transition hover:bg-amber-600"
        >
          Go to Top Up
        </button>
      </div>
    </div>
  );
}
