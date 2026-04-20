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
      shell: "dashboard-subpanel !border-sky-300/45 !bg-[linear-gradient(135deg,rgba(115,200,255,0.28),rgba(115,200,255,0.12)_50%,rgba(255,255,255,0.96))]",
      badge: "dashboard-accent-surface text-white",
      button: "dashboard-accent-surface text-[var(--dashboard-accent-text)]",
      glow: "from-sky-500/14 via-sky-300/10 to-transparent",
      ring: "group-hover:!border-sky-300/60",
    },
    emerald: {
      shell: "dashboard-subpanel !border-emerald-300/45 !bg-[linear-gradient(135deg,rgba(183,223,105,0.34),rgba(183,223,105,0.12)_48%,rgba(255,255,255,0.96))]",
      badge: "dashboard-accent-surface text-white",
      button: "dashboard-accent-surface text-[var(--dashboard-accent-text)]",
      glow: "from-emerald-500/16 via-emerald-300/10 to-transparent",
      ring: "group-hover:!border-emerald-300/60",
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
      <div className="dashboard-subpanel mt-4 rounded-[32px] border border-white/10 p-5 sm:p-6">
        <div className="max-w-2xl">
          <p className="dashboard-text-faint text-[10px] font-black uppercase tracking-[0.28em]">Payments</p>
          <h1 className="dashboard-text-strong mt-2 text-3xl font-black tracking-tight md:text-4xl">
            Select a payment method
          </h1>
          <p className="dashboard-text-muted mt-3 text-sm leading-6">
            Pick the option that works best for you.
          </p>
        </div>
      </div>

      {paymentStatus?.issues?.length ? (
        <div className="dashboard-subpanel flex items-start gap-3 rounded-[24px] border border-amber-300/50 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(255,255,255,0.96)_55%)] p-4 shadow-[0_14px_40px_rgba(245,158,11,0.12)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700">
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
