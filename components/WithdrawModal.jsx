"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
// Icons used for better visual clarity
import { X, Loader2, CheckCircle, Wallet, Banknote, CreditCard, DollarSign } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { blockDecimalInput, isWholeNumberInputValue, parseWholeNumberAmount } from "@/lib/wholeAmount";

/* ================= CONFIG ================= */
const METHODS = ["bkash", "nagad", "bank", "crypto"];
const MINIMUM_WITHDRAW_AMOUNT = 10; // $10 Minimum

// Utility to get method-specific icon
const getMethodIcon = (method) => {
  switch (method) {
    case "bkash":
    case "nagad":
      return Wallet;
    case "bank":
      return Banknote;
    case "crypto":
      return CreditCard;
    default:
      return DollarSign;
  }
};

export default function WithdrawModal({ balance, onClose }) {
  // 1. Fetching Auth Data (Hook 1)
  const { token, userData, refreshUser, loading: isAuthLoading } = useFirebaseAuth();

  /* ================= 2. STATE (All Hooks defined unconditionally at the top) ================= */
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bkash");
  const [saveMethod, setSaveMethod] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [form, setForm] = useState({
    wallet: "", bankName: "", accountName: "", accountNo: "",
    branch: "", network: "USDT-TRC20", cryptoAddress: "",
  });

  const handleFormChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };


  /* ================= 3. MEMOIZED VALUES ================= */
  const savedMethod = userData?.payoutMethods?.[method]; 

  const isSavedMethod = useMemo(() => {
    if (!savedMethod) return false;

    if (method === "bkash" || method === "nagad") {
      return Boolean(savedMethod.number);
    }
    if (method === "bank") {
      return Boolean(savedMethod.bankName && savedMethod.accountName && savedMethod.accountNo);
    }
    if (method === "crypto") {
      return Boolean(savedMethod.network && savedMethod.address);
    }
    return false;
  }, [savedMethod, method]);

  /* ================= 4. AUTO FILL EFFECT ================= */
  useEffect(() => {
    if (!isSavedMethod) {
      setForm({
        wallet: "", bankName: "", accountName: "", accountNo: "",
        branch: "", network: "USDT-TRC20", cryptoAddress: "",
      });
      setSaveMethod(true); // Default to saving new methods
      return;
    }
    
    // Auto-fill logic...
    if (method === "bkash" || method === "nagad") {
      setForm((p) => ({ ...p, wallet: savedMethod.number }));
    } else if (method === "bank") {
      setForm((p) => ({
        ...p,
        bankName: savedMethod.bankName,
        accountName: savedMethod.accountName,
        accountNo: savedMethod.accountNo,
        branch: savedMethod.branch || "",
      }));
    } else if (method === "crypto") {
      setForm((p) => ({
        ...p,
        network: savedMethod.network,
        cryptoAddress: savedMethod.address,
      }));
    }
  }, [method, isSavedMethod, savedMethod]);


  /* ================= 5. CONDITIONAL RENDER (The Guard) ================= */
  if (isAuthLoading || !userData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl flex items-center gap-3 shadow-2xl">
          <Loader2 className="animate-spin text-indigo-600" size={24} />
          <span className="font-semibold text-gray-700">Loading payout info...</span>
        </div>
      </div>
    );
  }

  const parsedAmount = parseWholeNumberAmount(amount);

  /* ================= 6. SUBMIT HANDLER ================= */
  const submitWithdraw = async () => {
    // --- Validation ---
    if (parsedAmount === null) {
      return Swal.fire("Error", "Withdraw amount must be a whole number.", "error");
    }

    // 💡 VALIDATION: Check Minimum Amount
    if (parsedAmount < MINIMUM_WITHDRAW_AMOUNT) {
        return Swal.fire("Error", `The minimum withdrawal amount is $${MINIMUM_WITHDRAW_AMOUNT}.`, "error");
    }
    
    // Check balance limit
    if (parsedAmount > balance) {
      return Swal.fire("Error", "Insufficient referral balance.", "error");
    }

    let accountPayload = {};

    // --- Method-Specific Validation & Payload Construction ---
    if (method === "bkash" || method === "nagad") {
      if (!form.wallet)
        return Swal.fire("Error", `${method.toUpperCase()} Wallet number required.`, "error");
      accountPayload = { number: form.wallet };
    } else if (method === "bank") {
      if (!form.bankName || !form.accountName || !form.accountNo)
        return Swal.fire("Error", "Complete bank information required.", "error");

      accountPayload = {
        bankName: form.bankName, accountName: form.accountName, accountNo: form.accountNo, branch: form.branch,
      };
    } else if (method === "crypto") {
      if (!form.cryptoAddress)
        return Swal.fire("Error", "Crypto wallet address required.", "error");

      accountPayload = {
        network: form.network, address: form.cryptoAddress,
      };
    }
    
    // --- API Call ---
    setIsSubmitting(true); 

    try {
      const res = await fetch("/api/affiliate/payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parsedAmount,
          method,
          account: accountPayload,
          saveMethod: !isSavedMethod && saveMethod, 
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Withdrawal failed.");

      Swal.fire("Success", "Withdraw request submitted. Pending admin approval.", "success");
      refreshUser?.(); 
      onClose(); 
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setIsSubmitting(false); 
    }
  };

  /* ================= 7. UI RENDER ================= */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-frame-bg)] p-6 shadow-[0_26px_80px_rgba(15,23,42,0.24)] sm:p-7">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)] text-[var(--dashboard-text-muted)] transition hover:text-[var(--dashboard-text-strong)]"
        >
          <X size={18} />
        </button>

        <div className="mb-6 flex items-center gap-3 border-b border-[var(--dashboard-frame-border)] pb-4 pr-10">
          <span className="dashboard-accent-surface inline-flex h-10 w-10 items-center justify-center rounded-xl">
            <DollarSign size={18} />
          </span>
          <div>
            <h2 className="dashboard-text-strong text-[1.5rem] font-black tracking-tight">Process Payout</h2>
            <p className="dashboard-text-muted text-xs">Submit your withdraw request securely</p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-success-soft)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="dashboard-text-muted text-sm font-bold">Available Balance</span>
            <p className="dashboard-text-strong text-[1.7rem] font-black leading-none">${balance}</p>
          </div>
        </div>

        <div className="mb-5">
          <label className="dashboard-text-muted mb-2 block text-sm font-semibold">Amount to Withdraw</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold dashboard-text-faint">$</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={`Enter minimum $${MINIMUM_WITHDRAW_AMOUNT}`}
              value={amount}
              onKeyDown={blockDecimalInput}
              onChange={(e) => {
                const value = e.target.value;
                if (isWholeNumberInputValue(value)) setAmount(value);
              }}
              className="dashboard-text-strong w-full rounded-xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] py-3 pl-8 pr-4 text-lg font-semibold placeholder:dashboard-text-faint focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"
            />
          </div>

          {parsedAmount > 0 && parsedAmount < MINIMUM_WITHDRAW_AMOUNT && (
            <p className="mt-1 text-xs font-medium text-amber-500">
              Minimum withdrawal amount must be ${MINIMUM_WITHDRAW_AMOUNT}.
            </p>
          )}

          {parsedAmount > balance && (
            <p className="mt-1 text-xs font-medium text-red-500">
              Withdrawal amount cannot exceed available balance (${balance}).
            </p>
          )}
        </div>

        <div className="mb-5">
          <label className="dashboard-text-muted mb-2 block text-sm font-semibold">Select Payout Method</label>
          <div className="grid grid-cols-4 gap-2 rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)] p-1.5">
            {METHODS.map((m) => {
              const Icon = getMethodIcon(m);
              return (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex items-center justify-center rounded-xl py-2 text-xs font-black uppercase transition ${
                    method === m
                      ? "dashboard-accent-surface"
                      : "dashboard-text-muted hover:bg-[var(--dashboard-frame-bg)]"
                  }`}
                >
                  <Icon size={14} className="mr-1 hidden sm:inline" />
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {isSavedMethod && (
          <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
            <CheckCircle size={16} className="flex-shrink-0" />
            Saved method loaded. Fields are locked for security.
          </p>
        )}

        <div className="mb-5 space-y-3 pt-1">
          {(method === "bkash" || method === "nagad") && (
            <input
              disabled={isSavedMethod}
              value={form.wallet}
              onChange={(e) => handleFormChange('wallet', e.target.value)}
              placeholder={`${method.toUpperCase()} Wallet Number`}
              className={`w-full rounded-xl border px-4 py-3 text-sm transition ${
                isSavedMethod
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500 placeholder:text-gray-400"
                  : "dashboard-text-strong border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] placeholder:dashboard-text-faint focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"
              }`}
            />
          )}

          {method === "bank" && (
            <>
              <input disabled={isSavedMethod} value={form.bankName} onChange={(e) => handleFormChange('bankName', e.target.value)} placeholder="Bank Name (Required)" className={`w-full rounded-xl border px-4 py-3 text-sm transition ${isSavedMethod ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500 placeholder:text-gray-400" : "dashboard-text-strong border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] placeholder:dashboard-text-faint focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"}`}/>
              <input disabled={isSavedMethod} value={form.accountName} onChange={(e) => handleFormChange('accountName', e.target.value)} placeholder="Account Name (Required)" className={`w-full rounded-xl border px-4 py-3 text-sm transition ${isSavedMethod ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500 placeholder:text-gray-400" : "dashboard-text-strong border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] placeholder:dashboard-text-faint focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"}`}/>
              <input disabled={isSavedMethod} value={form.accountNo} onChange={(e) => handleFormChange('accountNo', e.target.value)} placeholder="Account Number (Required)" className={`w-full rounded-xl border px-4 py-3 text-sm transition ${isSavedMethod ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500 placeholder:text-gray-400" : "dashboard-text-strong border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] placeholder:dashboard-text-faint focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"}`}/>
              <input disabled={isSavedMethod} value={form.branch} onChange={(e) => handleFormChange('branch', e.target.value)} placeholder="Branch Name (Optional)" className={`w-full rounded-xl border px-4 py-3 text-sm transition ${isSavedMethod ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500 placeholder:text-gray-400" : "dashboard-text-strong border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] placeholder:dashboard-text-faint focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"}`}/>
            </>
          )}

          {method === "crypto" && (
            <>
              <select disabled={isSavedMethod} value={form.network} onChange={(e) => handleFormChange('network', e.target.value)} className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm transition ${isSavedMethod ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500" : "dashboard-text-strong border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"}`}>
                <option value="USDT-TRC20">USDT (TRC20 Network)</option>
                <option value="USDT-BEP20">USDT (BEP20 Network)</option>
              </select>

              <input disabled={isSavedMethod} value={form.cryptoAddress} onChange={(e) => handleFormChange('cryptoAddress', e.target.value)} placeholder="USDT Wallet Address" className={`w-full rounded-xl border px-4 py-3 text-sm transition ${isSavedMethod ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500 placeholder:text-gray-400" : "dashboard-text-strong border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] placeholder:dashboard-text-faint focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-success-soft)]"}`}/>
            </>
          )}
        </div>

        {!isSavedMethod && (
          <label className="dashboard-text-muted mb-5 flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={saveMethod}
              onChange={() => setSaveMethod(!saveMethod)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="font-medium">Save this payout method for future withdrawals.</span>
          </label>
        )}

        <button
          onClick={submitWithdraw}
          disabled={isSubmitting || parsedAmount < MINIMUM_WITHDRAW_AMOUNT || parsedAmount > balance}
          className={`w-full rounded-xl py-3 text-base font-black transition ${
            isSubmitting || parsedAmount < MINIMUM_WITHDRAW_AMOUNT || parsedAmount > balance
              ? "cursor-not-allowed bg-[var(--dashboard-button-muted)] text-[var(--dashboard-button-muted-text)]"
              : "dashboard-accent-surface"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            "Submit Withdraw Request"
          )}
        </button>
      </div>
    </div>
  );
}
