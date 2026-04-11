"use client";

import { useState } from "react";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import { blockDecimalInput, isWholeNumberInputValue, parseWholeNumberAmount } from "@/lib/wholeAmount";

const formatGatewayError = (data) => {
  const parts = [data?.error || data?.message || "Payment init failed"];
  if (Array.isArray(data?.issues) && data.issues.length) {
    parts.push(data.issues.join("\n"));
  }
  if (data?.gatewayStatus) {
    parts.push(`Gateway status: ${data.gatewayStatus}`);
  }
  return parts.join("\n\n");
};

export default function UddoktaPayForm({ token, setMethod }) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleUddoktaPay = async () => {
    const Swal = (await import("sweetalert2")).default;

    if (!amount) return Swal.fire("Error", "Amount required", "error");
    const parsedAmount = parseWholeNumberAmount(amount);
    if (parsedAmount === null) return Swal.fire("Error", "Amount must be a whole number", "error");
    if (!token) return Swal.fire("Error", "You must login first", "error");

    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: parsedAmount, reason: "Balance Top-up" }),
      });

      const data = await res.json();

      if (data.ok) {
        window.location.href = data.paymentUrl;
        return;
      }

      Swal.fire("Failed", formatGatewayError(data), "error");
    } catch (error) {
      Swal.fire("Failed", error.message || "Payment init failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full rounded-[32px] border border-sky-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_rgba(255,255,255,0.98)_42%,_rgba(248,250,252,0.96)_100%)] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-sky-700">
            <ShieldCheck size={12} />
            Automatic payment
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            UddoktaPay
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Fast, secure checkout with instant gateway processing.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Gateway</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">Automatic confirmation</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Top up amount</p>
            <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900">
              Enter the amount you want to add
            </h3>
          </div>

          <label className="mb-2 block text-sm font-bold text-slate-700">Amount (BDT)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            placeholder="e.g., 500"
            value={amount}
            onKeyDown={blockDecimalInput}
            onChange={(e) => {
              const value = e.target.value;
              if (isWholeNumberInputValue(value)) setAmount(value);
            }}
          />

          <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-slate-600">
            Enter a whole number only. You'll be redirected to the secure payment gateway after confirmation.
          </div>

          <button
            onClick={handleUddoktaPay}
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(2,132,199,0.28)] transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            {submitting ? "Starting payment..." : "Pay now"}
          </button>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.96))] p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)] sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Why choose this</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              Faster checkout with automatic verification.
            </li>
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              Best for smooth balance top-up with fewer steps.
            </li>
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              Ideal if you want a simple gateway flow.
            </li>
          </ul>

          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            onClick={() => {
              setMethod(null);
              setAmount("");
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to selection
          </button>
        </div>
      </div>
    </section>
  );
}
