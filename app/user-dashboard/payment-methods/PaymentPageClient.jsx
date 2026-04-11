"use client";

import { useEffect, useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { AlertTriangle, CheckCircle2, ChevronRight, CreditCard, Landmark, ShieldCheck } from "lucide-react";
import UddoktaPayForm from "@/components/PaymentsSection/UddoktaPay";
import BankPayForm from "@/components/PaymentsSection/BankPay";
import PaymentHistory from "@/components/PaymentsSection/PaymentHistory";

function PaymentOptionCard({
  title,
  description,
  actionLabel,
  icon: Icon,
  accent,
  helper,
  disabled = false,
  onClick,
}) {
  const accentStyles = {
    blue: {
      shell: "border-sky-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_rgba(255,255,255,0.98)_46%,_rgba(248,250,252,0.96)_100%)]",
      badge: "bg-sky-600 text-white",
      button: "bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-200",
      glow: "from-sky-500/18 via-sky-400/10 to-transparent",
      ring: "group-hover:border-sky-300",
    },
    emerald: {
      shell: "border-emerald-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_rgba(255,255,255,0.98)_46%,_rgba(248,250,252,0.96)_100%)]",
      badge: "bg-emerald-600 text-white",
      button: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200",
      glow: "from-emerald-500/18 via-emerald-400/10 to-transparent",
      ring: "group-hover:border-emerald-300",
    },
  };

  const style = accentStyles[accent] || accentStyles.blue;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden rounded-[30px] border p-0 text-left shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 ${style.shell} ${style.ring}`}
    >
      <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow}`} />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />

      <div className="relative z-10 flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${style.badge}`}>
              <Icon size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                <ShieldCheck size={12} />
                Preferred
              </div>
              <h2 className="mt-3 text-[1.4rem] font-black tracking-tight text-slate-900">{title}</h2>
            </div>
          </div>
          <ChevronRight className="mt-1 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </div>

        <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">{description}</p>

        <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <CheckCircle2 size={14} className="text-emerald-500" />
          {helper}
        </div>

        <div className="mt-6">
          <span
            className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold shadow-sm transition ${style.button} ${
              disabled ? "bg-slate-300 text-slate-600 hover:bg-slate-300" : ""
            }`}
          >
            {actionLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function PaymentPageClient() {
  const [method, setMethod] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const { token } = useFirebaseAuth();

  useEffect(() => {
    const showPaymentState = async () => {
      const Swal = (await import("sweetalert2")).default;
      const params = new URLSearchParams(window.location.search);
      const paymentState = params.get("payment");

      if (paymentState === "success") {
        Swal.fire("Success", "Payment completed and balance updated.", "success");
      }

      if (paymentState === "failed") {
        Swal.fire("Failed", "Payment verification failed. Please try again.", "error");
      }
    };

    showPaymentState();
  }, []);

  useEffect(() => {
    const loadPaymentStatus = async () => {
      try {
        const res = await fetch("/api/payment/status", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) {
          setPaymentStatus(data);
        }
      } catch (error) {
        console.error("Payment status load failed:", error);
      }
    };

    loadPaymentStatus();
  }, []);



  return (
    <div className="min-h-screen space-y-8 bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.9),_rgba(248,250,252,0.98)_34%,_rgba(241,245,249,1)_100%)] p-4 text-slate-800 md:p-8">
      <div className="rounded-[32px] border border-white/80 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-600">Payments</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Select a payment method
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Pick the option that works best for you.
          </p>
        </div>
      </div>

      {paymentStatus?.issues?.length ? (
        <div className="flex items-start gap-3 rounded-[24px] border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,247,237,0.96))] p-4 text-amber-950 shadow-[0_14px_40px_rgba(251,191,36,0.12)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <p className="font-black tracking-tight">Payment system attention needed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900/90">
              {paymentStatus.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {!method && (
        <div className="grid gap-6 md:grid-cols-2">
          <PaymentOptionCard
            title="UddoktaPay"
            description="Quick and secure payment processing via an automatic gateway."
            actionLabel="Select UddoktaPay"
            icon={CreditCard}
            accent="blue"
            helper="Best for instant confirmation and smooth checkout."
            disabled={paymentStatus ? !paymentStatus.automaticPayment?.ready : false}
            onClick={() => {
              if (!paymentStatus || paymentStatus.automaticPayment?.ready) {
                setMethod("uddoktapay");
              }
            }}
          />

          <PaymentOptionCard
            title="Manual Bank Payment"
            description="Transfer funds directly via bank and upload the transaction screenshot."
            actionLabel="Select Bank Payment"
            icon={Landmark}
            accent="emerald"
            helper="Ideal when you prefer manual verification and upload."
            onClick={() => setMethod("bank")}
          />
        </div>
      )}

      {method === "uddoktapay" && <UddoktaPayForm token={token} setMethod={setMethod} />}
      {method === "bank" && (
        <BankPayForm
          token={token}
          setMethod={setMethod}
          bankDetails={paymentStatus?.manualPayment?.bankPaymentDetails || []}
        />
      )}

      <PaymentHistory />
    </div>
  );
}
