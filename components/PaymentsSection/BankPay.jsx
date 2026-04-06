"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Building2, CheckCircle2, Copy, Landmark } from "lucide-react";
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
  const [selectedBankId, setSelectedBankId] = useState("");

  const inputStyle =
    "w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-3 bg-white text-gray-800 placeholder-gray-400";
  const labelStyle = "text-sm font-semibold text-gray-700 block mb-1";
  const fieldRows = [
    { label: "Bank Name", key: "bankName", mono: false, wide: true },
    { label: "A/C Name", key: "accountName", mono: false },
    { label: "A/C Number", key: "accountNumber", mono: true },
    { label: "Branch", key: "branch", mono: false },
    { label: "District", key: "district", mono: false },
    { label: "Routing No", key: "routingNumber", mono: true },
    { label: "SWIFT", key: "swiftCode", mono: true },
    { label: "Reference", key: "reference", mono: false, wide: true },
  ];

  useEffect(() => {
    if (!bankDetails.length) {
      setSelectedBankId("");
      return;
    }

    setSelectedBankId((current) =>
      bankDetails.some((bank) => bank.id === current) ? current : bankDetails[0].id
    );
  }, [bankDetails]);

  const selectedBank = useMemo(
    () => bankDetails.find((bank) => bank.id === selectedBankId) || bankDetails[0] || null,
    [bankDetails, selectedBankId]
  );

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
    <div className="mx-auto max-w-4xl space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none sm:space-y-6 sm:rounded-xl sm:border sm:border-green-200 sm:bg-white sm:p-8 sm:shadow-lg">
      <h2 className="mb-2 border-b pb-2 text-xl font-bold text-green-600 sm:mb-4 sm:pb-3 sm:text-2xl">
        Manual Bank Transfer Request
      </h2>

      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base font-semibold text-gray-800 sm:text-lg">
          Bank Account Details (Transfer To)
        </h3>

        {bankDetails.length ? (
          <>
            <div className="rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-lime-50 p-3 sm:rounded-2xl sm:p-4">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-green-700 sm:mb-2 sm:text-xs">
                Select Bank
              </label>
              <div className="relative">
                <select
                  value={selectedBank?.id || ""}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-green-200 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:rounded-2xl sm:py-3 sm:pl-12 sm:pr-12"
                >
                  {bankDetails.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bankName}
                    </option>
                  ))}
                </select>
                <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-green-700" />
                <Landmark className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-green-700" />
              </div>
            </div>

            {selectedBank ? (
              <div className="w-full rounded-none border-0 bg-transparent p-0 sm:rounded-2xl sm:border sm:border-gray-200 sm:bg-gray-50 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Image
                    src={getBankLogoSrc(selectedBank)}
                    alt={selectedBank.bankName}
                    width={44}
                    height={44}
                    unoptimized={Boolean(selectedBank.logoUrl)}
                    className="rounded-full border border-gray-300"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                      Selected Account
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-gray-900 sm:text-lg">{selectedBank.bankName}</h4>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                        <CheckCircle2 size={12} />
                        Transfer To
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid w-full grid-cols-1 gap-2.5 text-sm sm:mt-4 sm:gap-3 md:grid-cols-2">
                  {fieldRows.map((field) => {
                    const rawValue = selectedBank[field.key];
                    const value = rawValue && String(rawValue).trim() ? rawValue : "N/A";

                    return (
                      <div
                        key={`${selectedBank.id}-${field.label}`}
                        className={field.wide ? "md:col-span-2" : ""}
                      >
                        <div className="flex min-h-[64px] items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:min-h-[72px] sm:px-4 sm:py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-500">{field.label}</p>
                            <p
                              className={`mt-1 break-words text-gray-800 ${
                                field.mono ? "font-mono text-[15px] text-lime-600" : "font-medium"
                              }`}
                            >
                              {value}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyField(field.label, value === "N/A" ? "" : value)}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-lime-200 text-lime-600 transition hover:bg-lime-50"
                            aria-label={`Copy ${field.label}`}
                          >
                            <Copy size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
            No bank payment details configured by admin yet.
          </div>
        )}
      </div>

      <hr className="border-gray-200" />

      <div className="space-y-3 sm:space-y-4">
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
            className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100 sm:file:mr-4 sm:file:px-4"
          />
          <p className="text-xs text-gray-400 mt-1">
            Upload the screenshot of your successful bank transfer. (Max size: 5MB)
          </p>
        </div>
      </div>

      <button
        onClick={handleManualPayment}
        className="w-full rounded-lg bg-green-600 py-3 font-bold text-white shadow-lg transition hover:scale-[1.01] hover:bg-green-700"
      >
        Submit Payment Request
      </button>

      <button
        className="mt-1 flex w-full items-center justify-center text-sm text-gray-600 hover:text-green-600 sm:mt-3"
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
