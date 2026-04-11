"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { blockDecimalInput, isWholeNumberInputValue, parseWholeNumberAmount } from "@/lib/wholeAmount";

export default function IncreaseBudgetModal({
  open,
  onClose,
  adAccountId,
  oldLimit,
  onSuccess,
}) {
  const { token } = useFirebaseAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const proposedLimit = Number(oldLimit || 0) + Number(amount || 0);

  if (!open) return null;

  const submit = async () => {
    const parsedAmount = parseWholeNumberAmount(amount);

    if (parsedAmount === null) {
      return setError("Enter valid amount");
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/ads-request/update-limit", {
        method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ad_account_id: adAccountId,
            old_limit: Number(oldLimit),
            new_limit: Number(oldLimit) + parsedAmount,
          }),
        });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-600">Budget Action</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight">Increase Account Budget</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add more budget to this Meta ad account using your available wallet balance.
          </p>
        </div>

        <div className="relative mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Current Limit</p>
            <p className="mt-2 text-lg font-black text-slate-900">{`$${Number(oldLimit || 0).toFixed(2)}`}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(255,255,255,0.98))] p-4 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">New Limit</p>
            <p className="mt-2 text-lg font-black text-emerald-800">{`$${proposedLimit.toFixed(2)}`}</p>
          </div>
        </div>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Enter increase amount"
          className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-[0_10px_18px_rgba(15,23,42,0.04)] placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-100"
          value={amount}
          onKeyDown={blockDecimalInput}
          onChange={(e) => {
            const value = e.target.value;
            if (isWholeNumberInputValue(value)) setAmount(value);
          }}
        />

        {error && (
          <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="mt-2 flex w-full justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#14b8a6)] py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(14,165,233,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Update Budget"}
        </button>
      </div>
    </div>
  );
}
