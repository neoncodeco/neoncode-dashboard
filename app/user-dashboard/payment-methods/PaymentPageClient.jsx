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
      shell: "dashboard-subpanel border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-bg)]",
      badge: "dashboard-accent-surface",
      button: "dashboard-accent-surface text-[var(--dashboard-accent-text)]",
      glow: "from-[var(--dashboard-success-soft)] via-transparent to-transparent",
      ring: "group-hover:!border-[var(--dashboard-accent)]/55",
    },
    emerald: {
      shell: "dashboard-subpanel border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-bg)]",
      badge: "dashboard-accent-surface",
      button: "dashboard-accent-surface text-[var(--dashboard-accent-text)]",
      glow: "from-[var(--dashboard-success-soft)] via-transparent to-transparent",
      ring: "group-hover:!border-[var(--dashboard-accent)]/55",
    },
  };

  const style = accentStyles[accent] || accentStyles.blue;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden rounded-[28px] border p-0 text-left shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 ${style.shell} ${style.ring}`}
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
              <div className="dashboard-chip inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
                <ShieldCheck size={12} />
                Preferred
              </div>
              <h2 className="dashboard-text-strong mt-3 text-[1.4rem] font-black tracking-tight">{title}</h2>
            </div>
          </div>
          <ChevronRight className="dashboard-text-faint mt-1 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
        </div>

        <p className="dashboard-text-muted mt-4 max-w-md text-sm leading-6">{description}</p>

        <div className="dashboard-text-muted mt-5 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={14} className="text-[var(--dashboard-accent)]" />
          {helper}
        </div>

        <div className="mt-6">
          <span
            className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold shadow-sm transition ${style.button} ${
              disabled ? "!bg-[var(--dashboard-button-muted)] !text-[var(--dashboard-button-muted-text)]" : ""
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
    <div className="user-dashboard-theme-scope min-h-screen space-y-6 bg-transparent p-3 sm:p-4 lg:p-6">
      <div className="dashboard-subpanel mt-3 rounded-[32px] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-bg)] p-3 shadow-[0_20px_48px_rgba(15,23,42,0.14)] sm:p-4">
        <div className="max-w-2xl">
          <p className="dashboard-text-muted text-[10px] font-black uppercase tracking-[0.28em]">Payments</p>
          <h1 className="dashboard-text-strong mt-0.5 text-2xl font-black tracking-tight md:text-3xl">
            Select a payment method
          </h1>
          <p className="dashboard-text-muted mt-1 text-sm leading-5">
            Pick the option that works best for you.
          </p>
        </div>
      </div>

      {paymentStatus?.issues?.length ? (
        <div className="dashboard-subpanel flex items-start gap-3 rounded-[24px] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-warn-soft)] p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
          <div className="dashboard-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <p className="dashboard-text-strong font-black tracking-tight">Payment system attention needed</p>
            <ul className="dashboard-text-muted mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
              {paymentStatus.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {!method && (
        <div className="grid gap-4 md:grid-cols-2">
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
