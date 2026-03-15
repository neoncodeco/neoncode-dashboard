"use client";

import { useEffect, useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { AlertTriangle, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import UddoktaPayForm from "@/components/PaymentsSection/UddoktaPay";
import BankPayForm from "@/components/PaymentsSection/BankPay";
import PaymentHistory from "@/components/PaymentsSection/PaymentHistory";

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
    <div className="p-4 md:p-8 space-y-8 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-3xl font-extrabold text-blue-600 border-b pb-2">
        Make Payments
      </h1>

      <section className="grid gap-4 lg:grid-cols-2">
        <StatusCard
          title="Automatic Gateway"
          icon={paymentStatus?.automaticPayment?.ready ? CheckCircle2 : AlertTriangle}
          tone={paymentStatus?.automaticPayment?.ready ? "green" : "amber"}
          description={
            paymentStatus?.automaticPayment?.ready
              ? "Automatic checkout is configured and ready to send users to the gateway."
              : "Automatic checkout needs gateway configuration before it can complete payments."
          }
          details={[
            `Gateway URL: ${paymentStatus?.automaticPayment?.gatewayBaseUrl || "Not set"}`,
            `Webhook: ${paymentStatus?.automaticPayment?.webhookUrl || "Not set"}`,
          ]}
        />
        <StatusCard
          title="Manual Bank Payment"
          icon={ShieldCheck}
          tone="green"
          description="Manual payment requests are available. Users can submit transfer proof and wait for approval."
          details={["Bank transfer flow is enabled.", "Payment history records both manual and online payments."]}
        />
      </section>

      {paymentStatus?.issues?.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Payment system attention needed</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {paymentStatus.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!method && (
        <div className="grid md:grid-cols-2 gap-8">
          <div
            className="bg-white border-2 border-transparent rounded-xl p-8 shadow-lg hover:shadow-2xl hover:border-blue-500 transition-all duration-300 cursor-pointer flex flex-col items-start"
            onClick={() => {
              if (!paymentStatus || paymentStatus.automaticPayment?.ready) {
                setMethod("uddoktapay");
              }
            }}
          >
            <CreditCard className="w-10 h-10 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">UddoktaPay</h2>
            <p className="text-gray-500 mt-2 flex-grow">
              Quick and secure payment processing via an automatic gateway.
            </p>
            <button
              disabled={paymentStatus ? !paymentStatus.automaticPayment?.ready : false}
              className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-6 py-2 rounded-lg text-white font-medium transition duration-150 ease-in-out shadow-md"
            >
              Select UddoktaPay
            </button>
          </div>

          <div
            className="bg-white border-2 border-transparent rounded-xl p-8 shadow-lg hover:shadow-2xl hover:border-green-500 transition-all duration-300 cursor-pointer flex flex-col items-start"
            onClick={() => setMethod("bank")}
          >
            <CreditCard className="w-10 h-10 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Manual Bank Payment</h2>
            <p className="text-gray-500 mt-2 flex-grow">
              Transfer funds directly via bank and upload the transaction screenshot.
            </p>
            <button className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition duration-150 ease-in-out shadow-md">
              Select Bank Payment
            </button>
          </div>
        </div>
      )}

      {method === "uddoktapay" && <UddoktaPayForm token={token} setMethod={setMethod} />}
      {method === "bank" && <BankPayForm token={token} setMethod={setMethod} />}

      <PaymentHistory />
    </div>
  );
}

function StatusCard({ title, icon: Icon, tone, description, details }) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return (
    <div className={`rounded-xl border p-5 ${tones[tone] || tones.green}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5" />
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm">{description}</p>
          <div className="mt-3 space-y-1 text-xs opacity-90">
            {details.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
