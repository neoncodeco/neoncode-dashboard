"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Copy } from "lucide-react";
import { getBankLogoSrc } from "@/lib/bankDetails";

const MIN_BANK_PAYMENT_AMOUNT_BDT = 1000;

// ⭐ Upload to imgbb
const uploadToImgbb = async (imageFile) => {
  const apiKey = "fb16587c8cf01ccd11d8eba7fcdb988e";

  const form = new FormData();
  form.append("image", imageFile);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!data.success) throw new Error("Image upload failed!");
  return data.data.url; // final image URL
};

export default function BankPayForm({ token, setMethod, bankDetails = [] }) {
  const [amount, setAmount] = useState("");
  const [trxId, setTrxId] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  const inputStyle =
    "w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-3 bg-white text-gray-800 placeholder-gray-400";
  const labelStyle = "text-sm font-semibold text-gray-700 block mb-1";

  const copyField = async (label, value) => {
    const Swal = (await import("sweetalert2")).default;

    if (!String(value || "").trim()) {
      return Swal.fire("Empty", `${label} is not available`, "warning");
    }

    try {
      await navigator.clipboard.writeText(String(value));
      Swal.fire("Copied", `${label} copied to clipboard`, "success");
    } catch {
      Swal.fire("Error", `Could not copy ${label.toLowerCase()}`, "error");
    }
  };

  // ⭐ Manual Bank Payment
  const handleManualPayment = async () => {
    const Swal = (await import("sweetalert2")).default;
    if (!amount || !trxId || !screenshot) {
      return Swal.fire("Error", "Please fill all fields", "error");
    }
    if (!token) {
      return Swal.fire("Error", "You must login first", "error");
    }
    if (Number(amount) < MIN_BANK_PAYMENT_AMOUNT_BDT) {
      return Swal.fire(
        "Error",
        `Bank payment requires at least Tk ${MIN_BANK_PAYMENT_AMOUNT_BDT}. Use another method for smaller amounts.`,
        "error"
      );
    }

    try {
      Swal.fire({
        title: "Uploading Screenshot...",
        text: "Please wait...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // 1️⃣ Upload to imgbb
      const screenshotUrl = await uploadToImgbb(screenshot);

      // 2️⃣ Submit to backend
      const res = await fetch("/api/payment/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          trxId,
          screenshotUrl,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        Swal.fire("Success", "Manual payment request submitted", "success");

        setAmount("");
        setTrxId("");
        setScreenshot(null);
        setMethod(null);
      } else {
        Swal.fire("Error", data.error || "Failed to submit request", "error");
      }
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  return (
    <div className="bg-white border border-green-200 p-8 rounded-xl shadow-lg max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-green-600 border-b pb-3 mb-4">
        Manual Bank Transfer Request
      </h2>

      {/* Bank Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Bank Account Details (Transfer To)
        </h3>

        {bankDetails.length ? (
          bankDetails.map((bank) => (
            <div
              key={bank.id}
              className="w-full rounded-lg border border-gray-200 bg-gray-100 p-4"
            >
              <div className="flex items-start space-x-4">
                <Image
                  src={getBankLogoSrc(bank)}
                  alt={bank.bankName}
                  width={40}
                  height={40}
                  unoptimized={Boolean(bank.logoUrl)}
                  className="rounded-full border border-gray-300"
                />

                <div className="grid w-full grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  {[
                    { label: "Bank Name", value: bank.bankName, mono: false, wide: true },
                    { label: "A/C Name", value: bank.accountName, mono: false },
                    { label: "A/C Number", value: bank.accountNumber, mono: true },
                    { label: "Branch", value: bank.branch || "N/A", mono: false },
                    { label: "District", value: bank.district || "N/A", mono: false },
                    { label: "Routing No", value: bank.routingNumber || "N/A", mono: true },
                    { label: "SWIFT", value: bank.swiftCode || "N/A", mono: true },
                    { label: "Reference", value: bank.reference || "N/A", mono: false, wide: true },
                  ].map((field) => (
                    <div
                      key={`${bank.id}-${field.label}`}
                      className={field.wide ? "md:col-span-2" : ""}
                    >
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-500">{field.label}</p>
                          <p
                            className={`truncate text-gray-800 ${
                              field.mono ? "font-mono text-blue-700" : "font-medium"
                            }`}
                          >
                            {field.value}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyField(field.label, field.value === "N/A" ? "" : field.value)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-200 text-blue-700 transition hover:bg-blue-50"
                          aria-label={`Copy ${field.label}`}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
            No bank payment details configured by admin yet.
          </div>
        )}
      </div>

      <hr className="border-gray-200" />

      {/* Payment Form */}
      <div className="space-y-4">
        <div>
          <label className={labelStyle}>Amount (BDT)</label>
          <input
            type="number"
            className={inputStyle}
            placeholder={`Enter minimum Tk ${MIN_BANK_PAYMENT_AMOUNT_BDT}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={MIN_BANK_PAYMENT_AMOUNT_BDT}
          />
          <p className="mt-1 text-xs text-amber-600">
            Bank transfer is available only for amounts of Tk {MIN_BANK_PAYMENT_AMOUNT_BDT} or more.
          </p>
        </div>

        <div>
          <label className={labelStyle}>Transaction ID / Slip No.</label>
          <input
            type="text"
            className={inputStyle}
            placeholder="Enter the transaction reference ID"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
          />
        </div>

        <div>
          <label className={labelStyle}>Payment Screenshot (Proof)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshot(e.target.files[0])}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <p className="text-xs text-gray-400 mt-1">
            Upload the screenshot of your successful bank transfer. (Max size: 5MB)
          </p>
        </div>
      </div>

      <button
        onClick={handleManualPayment}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg transform hover:scale-[1.01]"
      >
        Submit Payment Request
      </button>

      <button
        className="flex items-center justify-center w-full mt-3 text-sm text-gray-600 hover:text-green-600"
        onClick={() => {
          setMethod(null);
          setAmount("");
          setTrxId("");
          setScreenshot(null);
        }}
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Go Back to Selection
      </button>
    </div>
  );
}
