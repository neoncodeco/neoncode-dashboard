"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Copy, Landmark, Upload } from "lucide-react";
import { getBankLogoSrc } from "@/lib/bankDetails";
import { blockDecimalInput, isWholeNumberInputValue, parseWholeNumberAmount } from "@/lib/wholeAmount";

const MIN_BANK_PAYMENT_AMOUNT_BDT = 1000;

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
  return data.data.url;
};

export default function BankPayForm({ token, setMethod, bankDetails = [] }) {
  const [amount, setAmount] = useState("");
  const [trxId, setTrxId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [selectedBankId, setSelectedBankId] = useState("");

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

  const getBankOptionLabel = (bank, index) => {
    const name = String(bank?.bankName || "").trim();
    const accountName = String(bank?.accountName || "").trim();
    const accountNumber = String(bank?.accountNumber || "").trim();

    if (name) return name;
    if (accountName) return `${accountName} (${index + 1})`;
    if (accountNumber) return `Bank Account ${accountNumber}`;
    return `Bank ${index + 1}`;
  };

  const getBankMonogram = (bank, index) => {
    const label = getBankOptionLabel(bank, index);
    return label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

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

  const handleManualPayment = async () => {
    const Swal = (await import("sweetalert2")).default;

    if (!amount || !trxId || !screenshot) {
      return Swal.fire("Error", "Please fill all fields", "error");
    }
    if (!/^\d+$/.test(amount)) {
      return Swal.fire("Error", "Amount must be a whole number", "error");
    }
    if (!token) {
      return Swal.fire("Error", "You must login first", "error");
    }

    const parsedAmount = parseWholeNumberAmount(amount);
    if (parsedAmount === null) {
      return Swal.fire("Error", "Amount must be a whole number", "error");
    }

    if (parsedAmount < MIN_BANK_PAYMENT_AMOUNT_BDT) {
      return Swal.fire(
        "Error",
        `Bank payment requires at least Tk ${MIN_BANK_PAYMENT_AMOUNT_BDT}. Use another method for smaller amounts.`,
        "error"
      );
    }

    try {
      Swal.fire({
        title: "Uploading screenshot...",
        text: "Please wait while we prepare your request.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const screenshotUrl = await uploadToImgbb(screenshot);

      const res = await fetch("/api/payment/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parsedAmount,
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

  const bankBadgeCount = bankDetails.length;

  return (
    <section className="w-full rounded-[32px] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-bg)] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 border-b border-[var(--dashboard-frame-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="dashboard-chip inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]">
            <Landmark size={12} />
            Manual bank transfer
          </div>
          <h2 className="dashboard-text-strong mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            Bank Payment
          </h2>
          <p className="dashboard-text-muted mt-2 text-sm leading-6">
            Transfer to one of the listed bank accounts and upload your payment proof.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          <button
            className="btn-secondary inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition"
            onClick={() => {
              setMethod(null);
              setAmount("");
              setTrxId("");
              setScreenshot(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to selection
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[28px] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)] p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="dashboard-text-muted text-[10px] font-black uppercase tracking-[0.22em]">Destination account</p>
              <h3 className="dashboard-text-strong mt-2 text-lg font-black tracking-tight">
                Choose the bank account for transfer
              </h3>
            </div>
          </div>

          {bankDetails.length ? (
            <>
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="dashboard-text-muted block text-sm font-bold">Select Bank</label>
                  <div className="dashboard-chip hidden px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] sm:inline-flex">
                    {bankBadgeCount} options
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {bankDetails.map((bank, index) => {
                    const isSelected = selectedBank?.id === bank.id;
                    return (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBankId(bank.id)}
                        className={`group relative flex h-full cursor-pointer flex-col gap-3 overflow-hidden rounded-[26px] border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-input-bg)] shadow-[0_18px_50px_rgba(15,23,42,0.14)] ring-2 ring-[var(--dashboard-success-soft)]"
                            : "border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-bg)] shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:border-[var(--dashboard-accent)]/55 hover:shadow-[0_14px_32px_rgba(15,23,42,0.12)]"
                        }`}
                      >
                        {isSelected ? (
                          <span className="dashboard-accent-surface absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] shadow-sm">
                            <CheckCircle2 size={11} />
                            Active
                          </span>
                        ) : null}

                        <div
                          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border-2 self-start ${
                            isSelected ? "border-emerald-300 bg-white shadow-sm" : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          {bank.logoUrl || getBankLogoSrc(bank) ? (
                            <Image
                              src={getBankLogoSrc(bank)}
                              alt={bank.bankName || getBankOptionLabel(bank, index)}
                              width={56}
                              height={56}
                              unoptimized={Boolean(bank.logoUrl)}
                              className="h-12 w-12 rounded-2xl object-contain bg-white p-1.5"
                            />
                          ) : (
                            <span className="text-base font-black text-emerald-700">
                              {getBankMonogram(bank, index)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-base font-black tracking-tight text-slate-900">
                                {getBankOptionLabel(bank, index)}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {bank.accountName || bank.accountNumber || "Bank transfer destination"}
                              </p>
                            </div>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                isSelected
                                  ? "bg-[var(--dashboard-success-soft)] dashboard-text-strong"
                                  : "bg-[var(--dashboard-panel-soft)] dashboard-text-muted"
                              }`}
                            >
                              {isSelected ? "Selected" : "Tap to select"}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-500">
                            {bank.branch ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1">{bank.branch}</span>
                            ) : null}
                            {bank.district ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1">{bank.district}</span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedBank ? (
                <div className="mt-5 rounded-[28px] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-emerald-200 bg-white shadow-sm">
                        <Image
                          src={getBankLogoSrc(selectedBank)}
                          alt={selectedBank.bankName}
                          width={52}
                          height={52}
                          unoptimized={Boolean(selectedBank.logoUrl)}
                          className="h-12 w-12 rounded-2xl object-contain bg-white p-1"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="dashboard-text-muted text-[10px] font-black uppercase tracking-[0.18em]">
                          Selected account
                        </p>
                        <h4 className="dashboard-text-strong mt-1 truncate text-xl font-black tracking-tight">
                          {getBankOptionLabel(selectedBank, bankDetails.findIndex((bank) => bank.id === selectedBank.id))}
                        </h4>
                        <div className="dashboard-accent-surface mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold">
                          <CheckCircle2 size={12} />
                          Transfer destination
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:min-w-[280px]">
                      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                        <p className="font-black uppercase tracking-[0.16em] text-slate-400">Branch</p>
                        <p className="mt-1 font-semibold text-slate-800">{selectedBank.branch || "N/A"}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                        <p className="font-black uppercase tracking-[0.16em] text-slate-400">District</p>
                        <p className="mt-1 font-semibold text-slate-800">{selectedBank.district || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                    {fieldRows.map((field) => {
                      const rawValue = selectedBank[field.key];
                      const value = rawValue && String(rawValue).trim() ? rawValue : "N/A";

                      return (
                        <div key={`${selectedBank.id}-${field.label}`} className={field.wide ? "md:col-span-2" : ""}>
                          <div className="flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                                {field.label}
                              </p>
                              <p
                                className={`mt-1 break-words text-slate-900 ${
                                  field.mono ? "font-mono text-[15px] font-semibold text-emerald-700" : "text-sm font-semibold"
                                }`}
                              >
                                {value}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyField(field.label, value === "N/A" ? "" : value)}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
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
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
              No bank payment details configured by admin yet.
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
          <div className="rounded-[28px] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)] p-5 shadow-[0_16px_45px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="mb-5">
              <p className="dashboard-text-muted text-[10px] font-black uppercase tracking-[0.22em]">Payment details</p>
              <h3 className="dashboard-text-strong mt-2 text-lg font-black tracking-tight">
                Fill in your transfer information
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="dashboard-text-muted mb-2 block text-sm font-bold">Amount (BDT)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-2xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] px-4 py-3.5 text-base font-semibold text-[var(--dashboard-text-strong)] outline-none transition placeholder:text-[var(--dashboard-placeholder)] focus:border-[var(--dashboard-accent)] focus:ring-4 focus:ring-[var(--dashboard-success-soft)]"
                  placeholder={`Enter minimum Tk ${MIN_BANK_PAYMENT_AMOUNT_BDT}`}
                  value={amount}
                  onKeyDown={blockDecimalInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isWholeNumberInputValue(value)) setAmount(value);
                  }}
                />
                <p className="dashboard-text-muted mt-2 text-xs leading-5">
                  Bank transfer is available only for amounts of Tk {MIN_BANK_PAYMENT_AMOUNT_BDT} or more.
                </p>
              </div>

              <div>
                <label className="dashboard-text-muted mb-2 block text-sm font-bold">Transaction ID / Slip No.</label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] px-4 py-3.5 text-base font-semibold text-[var(--dashboard-text-strong)] outline-none transition placeholder:text-[var(--dashboard-placeholder)] focus:border-[var(--dashboard-accent)] focus:ring-4 focus:ring-[var(--dashboard-success-soft)]"
                  placeholder="Enter the transaction reference ID"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                />
              </div>

              <div>
                <label className="dashboard-text-muted mb-2 block text-sm font-bold">Payment Screenshot (Proof)</label>
                <label className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)] px-4 py-4 transition hover:border-[var(--dashboard-accent)]/60 hover:bg-[var(--dashboard-success-soft)]">
                  <span className="dashboard-text-strong inline-flex items-center gap-2 text-sm font-semibold">
                    <Upload size={16} className="text-[var(--dashboard-accent)]" />
                    {screenshot?.name ? screenshot.name : "Upload screenshot image"}
                  </span>
                  <span className="dashboard-text-muted text-xs leading-5">
                    PNG, JPG, or WEBP. Upload the screenshot of your successful transfer.
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)] p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)] sm:p-6">
            <p className="dashboard-text-muted text-[10px] font-black uppercase tracking-[0.22em]">Before you submit</p>
            <ul className="dashboard-text-muted mt-4 space-y-3 text-sm leading-6">
              <li className="rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)] px-4 py-3">
                Double-check the selected bank account before sending money.
              </li>
              <li className="rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)] px-4 py-3">
                Keep the transaction ID and screenshot visible for verification.
              </li>
              <li className="rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)] px-4 py-3">
                Requests below Tk {MIN_BANK_PAYMENT_AMOUNT_BDT} are not accepted here.
              </li>
            </ul>

            <button
              onClick={handleManualPayment}
              className="btn-primary mt-6 inline-flex w-full items-center justify-center rounded-2xl border px-5 py-3.5 text-sm font-bold transition hover:-translate-y-0.5"
            >
              Submit Payment Request
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}
