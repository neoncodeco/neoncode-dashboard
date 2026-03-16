"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

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
    if (!amount || Number(amount) <= 0) {
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
          new_limit: Number(oldLimit) + Number(amount),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 text-black backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(15,29,56,0.98),rgba(9,18,38,0.98))] p-6 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.95)]">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>

        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">Budget Action</p>
          <h3 className="mt-2 text-2xl font-black">Increase Account Budget</h3>
          <p className="mt-2 text-sm text-slate-400">
            Add more budget to this Meta ad account using your available wallet balance.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Current Limit</p>
            <p className="mt-2 text-lg font-black">{`$${Number(oldLimit || 0).toFixed(2)}`}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">New Limit</p>
            <p className="mt-2 text-lg font-black text-blue-200">{`$${proposedLimit.toFixed(2)}`}</p>
          </div>
        </div>

        <input
          type="number"
          placeholder="Enter increase amount"
          className="mb-3 w-full rounded-2xl border border-white/10 bg-[#132546] px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="mt-4 flex w-full justify-center rounded-2xl bg-blue-500 py-3 text-sm font-black text-white transition hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Update Budget"}
        </button>
      </div>
    </div>
  );
}
