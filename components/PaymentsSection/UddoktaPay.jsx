"use client";

import { useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
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
    <section className="w-full rounded-[32px] border border-emerald-300/35 bg-[linear-gradient(135deg,rgba(183,223,105,0.28),rgba(115,200,255,0.14)_52%,rgba(255,255,255,0.94))] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-[var(--dashboard-frame-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="dashboard-chip inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]">
            <ShieldCheck size={12} />
            Automatic payment
          </div>
          <h2 className="dashboard-text-strong mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            UddoktaPay
          </h2>
          <p className="dashboard-text-muted mt-2 text-sm leading-6">
            Fast, secure checkout with instant gateway processing.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          <button
            className="btn-secondary inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition"
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

      <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <div className="rounded-[28px] border border-emerald-300/45 bg-[linear-gradient(135deg,rgba(183,223,105,0.32),rgba(255,255,255,0.88)_55%)] p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-5">
            <p className="dashboard-text-muted text-[10px] font-black uppercase tracking-[0.22em]">Top up amount</p>
            <h3 className="dashboard-text-strong mt-2 text-lg font-black tracking-tight">
              Enter the amount you want to add
            </h3>
          </div>

          <label className="dashboard-text-muted mb-2 block text-sm font-bold">Amount (BDT)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full rounded-2xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] px-4 py-3.5 text-base font-semibold text-[var(--dashboard-text-strong)] outline-none transition placeholder:text-[var(--dashboard-placeholder)] focus:border-[var(--dashboard-accent)] focus:ring-4 focus:ring-[var(--dashboard-success-soft)]"
            placeholder="e.g., 500"
            value={amount}
            onKeyDown={blockDecimalInput}
            onChange={(e) => {
              const value = e.target.value;
              if (isWholeNumberInputValue(value)) setAmount(value);
            }}
          />

          <div className="dashboard-text-muted mt-4 rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-success-soft)] px-4 py-3 text-sm leading-6">
            Enter a whole number only. You&apos;ll be redirected to the secure payment gateway after confirmation.
          </div>

          <button
            onClick={handleUddoktaPay}
            disabled={submitting}
            className="btn-primary mt-6 inline-flex w-full items-center justify-center rounded-2xl border px-5 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Starting payment..." : "Pay now"}
          </button>
        </div>

        <div className="rounded-[28px] border border-sky-300/45 bg-[linear-gradient(135deg,rgba(115,200,255,0.3),rgba(255,255,255,0.9)_56%)] p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] sm:p-6">
          <p className="dashboard-text-muted text-[10px] font-black uppercase tracking-[0.22em]">Why choose this</p>
          <ul className="dashboard-text-muted mt-4 space-y-3 text-sm leading-6">
            <li className="rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)] px-4 py-3">
              Faster checkout with automatic verification.
            </li>
            <li className="rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)] px-4 py-3">
              Best for smooth balance top-up with fewer steps.
            </li>
            <li className="rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)] px-4 py-3">
              Ideal if you want a simple gateway flow.
            </li>
          </ul>

        </div>
      </div>
    </section>
  );
}
