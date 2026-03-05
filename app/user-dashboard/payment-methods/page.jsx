"use client";

import { useEffect, useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useSearchParams } from "next/navigation";
import { CreditCard } from "lucide-react";
import Swal from "sweetalert2";
import UddoktaPayForm from "@/components/PaymentsSection/UddoktaPay";
import BankPayForm from "@/components/PaymentsSection/BankPay";
import PaymentHistory from "@/components/PaymentsSection/PaymentHistory";



export default function PaymentPage() {
  const [method, setMethod] = useState(null);

  const { token } = useFirebaseAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    const paymentState = searchParams.get("payment");
    if (paymentState === "success") {
      Swal.fire("Success", "Payment completed and balance updated.", "success");
    }
    if (paymentState === "failed") {
      Swal.fire("Failed", "Payment verification failed. Please try again.", "error");
    }
  }, [searchParams]);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-3xl font-extrabold text-blue-600 border-b pb-2">
        Make Payments
      </h1>

      {/* Select Method */}
      {!method && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* UddoktaPay Card */}
          <div
            className="bg-white border-2 border-transparent rounded-xl p-8 shadow-lg hover:shadow-2xl hover:border-blue-500 transition-all duration-300 cursor-pointer flex flex-col items-start"
            onClick={() => setMethod("uddoktapay")}
          >
            <CreditCard className="w-10 h-10 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">UddoktaPay</h2>
            <p className="text-gray-500 mt-2 flex-grow">
              Quick and secure payment processing via an automatic gateway.
            </p>
            <button className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white font-medium transition duration-150 ease-in-out shadow-md">
              Select UddoktaPay
            </button>
          </div>

          {/* Manual Bank Payment Card */}
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

      {/* --- Payment Forms Section --- */}

      {/* UddoktaPay Form Component */}
      {method === "uddoktapay" && (
        <UddoktaPayForm 
          token={token} 
          setMethod={setMethod} 
        />
      )}

      {/* Manual Bank Payment Form Component */}
      {method === "bank" && (
        <BankPayForm 
          token={token} 
          setMethod={setMethod} 
        />
      )}
    
    <PaymentHistory />

    </div>
  );
}
