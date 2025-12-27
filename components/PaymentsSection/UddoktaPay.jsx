
"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";


export default function UddoktaPayForm({ token, setMethod }) {
  const [amount, setAmount] = useState("");

  const inputStyle =
    "w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-3 transition duration-150 ease-in-out bg-white text-gray-800 placeholder-gray-400";
  const labelStyle = "text-sm font-semibold text-gray-700 block mb-1";


  const handleUddoktaPay = async () => {
    if (!amount) return Swal.fire("Error", "Amount required", "error");
    if (!token) return Swal.fire("Error", "You must login first", "error");

    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, reason: "Balance Top-up" }),
    });

    const data = await res.json();

    if (data.ok) {
      window.location.href = data.paymentUrl;
    } else {
      Swal.fire("Failed", data.message || "Payment init failed", "error");
    }
  };

  return (
    <div className="bg-white border border-blue-200 p-8 rounded-xl shadow-lg max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-blue-600 border-b pb-3 mb-4">
        UddoktaPay Payment
      </h2>
      <div>
        <label className={labelStyle}>Amount (BDT)</label>
        <input
          type="number"
          className={inputStyle}
          placeholder="e.g., 500.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
        />
      </div>
      <button
        onClick={handleUddoktaPay}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition duration-150 ease-in-out shadow-lg transform hover:scale-[1.01]"
      >
        Pay Now via UddoktaPay
      </button>
      <button
        className="flex items-center justify-center w-full mt-3 text-sm text-gray-600 hover:text-blue-600 transition"
        onClick={() => {
          setMethod(null);
          setAmount("");
        }}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Go Back to Selection
      </button>
    </div>
  );
}