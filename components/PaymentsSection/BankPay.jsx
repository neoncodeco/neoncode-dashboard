"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Copy, Upload } from "lucide-react";
import { getBankLogoSrc } from "@/lib/bankDetails";
import { blockDecimalInput, isWholeNumberInputValue, parseWholeNumberAmount } from "@/lib/wholeAmount";

const MIN_BANK_PAYMENT_AMOUNT_BDT = 1000;

const DETAIL_FIELDS = [
  { label: "Bank", key: "bankName" },
  { label: "Account name", key: "accountName" },
  { label: "Account number", key: "accountNumber", mono: true },
  { label: "Branch", key: "branch" },
  { label: "District", key: "district" },
  { label: "Routing", key: "routingNumber", mono: true },
  { label: "SWIFT", key: "swiftCode", mono: true },
  { label: "Reference", key: "reference" },
];

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

  const copyField = async (label, value) => {
    const Swal = (await import("sweetalert2")).default;

    if (!String(value || "").trim()) {
      return Swal.fire("Empty", `${label} is not available`, "warning");
    }

    try {
      await navigator.clipboard.writeText(String(value));
      Swal.fire({ icon: "success", title: "Copied", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire("Error", `Could not copy ${label.toLowerCase()}`, "error");
    }
  };

  const copyAllBankDetails = async (bank) => {
    const Swal = (await import("sweetalert2")).default;

    if (!bank) {
      return Swal.fire("Unavailable", "No bank account selected", "warning");
    }

    const lines = DETAIL_FIELDS.map((field) => {
      const value = bank[field.key];
      return `${field.label}: ${value && String(value).trim() ? value : "N/A"}`;
    });

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      Swal.fire({ icon: "success", title: "All details copied", timer: 1400, showConfirmButton: false });
    } catch {
      Swal.fire("Error", "Could not copy bank details", "error");
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

  const resetForm = () => {
    setMethod(null);
    setAmount("");
    setTrxId("");
    setScreenshot(null);
  };

  return (
    <div className="mx-auto w-full max-w-lg px-1 sm:max-w-xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-1.5 text-sm font-medium dashboard-text-muted transition hover:dashboard-text-strong"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="mb-6">
        <h2 className="dashboard-text-strong text-xl font-semibold tracking-tight sm:text-2xl">Bank transfer</h2>
        <p className="dashboard-text-muted mt-1 text-sm leading-relaxed">
          Send money to the account below, then submit your payment proof.
        </p>
      </div>

      {!bankDetails.length ? (
        <div className="rounded-lg border border-dashed border-[var(--dashboard-frame-border)] px-4 py-10 text-center text-sm dashboard-text-muted">
          No bank payment details configured yet.
        </div>
      ) : (
        <div className="space-y-6">
          {bankDetails.length > 1 ? (
            <div>
              <label htmlFor="bank-select" className="mb-1.5 block text-xs font-medium dashboard-text-muted">
                Destination bank
              </label>
              <select
                id="bank-select"
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full rounded-lg border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] px-3 py-2.5 text-sm font-medium dashboard-text-strong outline-none focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"
              >
                {bankDetails.map((bank, index) => (
                  <option key={bank.id} value={bank.id}>
                    {getBankOptionLabel(bank, index)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {selectedBank ? (
            <div className="overflow-hidden rounded-xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--dashboard-frame-border)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white">
                    <Image
                      src={getBankLogoSrc(selectedBank)}
                      alt={selectedBank.bankName || "Bank"}
                      width={28}
                      height={28}
                      unoptimized={Boolean(selectedBank.logoUrl)}
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold dashboard-text-strong">
                      {getBankOptionLabel(
                        selectedBank,
                        bankDetails.findIndex((bank) => bank.id === selectedBank.id)
                      )}
                    </p>
                    <p className="truncate text-xs dashboard-text-muted">
                      {selectedBank.accountName || selectedBank.accountNumber || "Transfer destination"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyAllBankDetails(selectedBank)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--dashboard-accent-text)] transition hover:bg-[var(--dashboard-panel-soft)]"
                >
                  <Copy size={13} />
                  Copy all
                </button>
              </div>

              <div className="divide-y divide-[var(--dashboard-frame-border)]">
                {DETAIL_FIELDS.map((field) => {
                  const rawValue = selectedBank[field.key];
                  const value = rawValue && String(rawValue).trim() ? rawValue : "—";

                  return (
                    <div
                      key={field.key}
                      className="group flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] dashboard-text-muted">{field.label}</p>
                        <p
                          className={`mt-0.5 text-sm font-medium dashboard-text-strong ${
                            field.mono ? "font-mono text-[13px]" : ""
                          }`}
                        >
                          {value}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyField(field.label, value === "—" ? "" : value)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-[var(--dashboard-panel-soft)] hover:text-[var(--dashboard-accent-text)]"
                        aria-label={`Copy ${field.label}`}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium dashboard-text-muted">Amount (BDT)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full rounded-lg border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] px-3 py-2.5 text-sm font-medium dashboard-text-strong outline-none focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"
                placeholder={`Min. Tk ${MIN_BANK_PAYMENT_AMOUNT_BDT}`}
                value={amount}
                onKeyDown={blockDecimalInput}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isWholeNumberInputValue(value)) setAmount(value);
                }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium dashboard-text-muted">Transaction ID</label>
              <input
                type="text"
                className="w-full rounded-lg border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] px-3 py-2.5 text-sm font-medium dashboard-text-strong outline-none focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"
                placeholder="Reference or slip number"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium dashboard-text-muted">Payment proof</label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[var(--dashboard-frame-border)] bg-[var(--dashboard-input-bg)] px-3 py-3 transition hover:border-[var(--dashboard-accent)]/40">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--dashboard-panel-soft)]">
                  <Upload size={15} className="text-[var(--dashboard-accent-text)]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium dashboard-text-strong">
                    {screenshot?.name || "Upload screenshot"}
                  </span>
                  <span className="block text-xs dashboard-text-muted">PNG, JPG or WEBP</span>
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

          <button
            type="button"
            onClick={handleManualPayment}
            className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold transition"
          >
            Submit payment request
          </button>

          <p className="text-center text-xs leading-relaxed dashboard-text-muted">
            Minimum Tk {MIN_BANK_PAYMENT_AMOUNT_BDT}. Verify the account before transferring.
          </p>
        </div>
      )}
    </div>
  );
}
