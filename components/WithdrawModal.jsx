"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
// Icons used for better visual clarity
import { X, Loader2, CheckCircle, Wallet, Banknote, CreditCard, DollarSign } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

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

  /* ================= 6. SUBMIT HANDLER ================= */
  const submitWithdraw = async () => {
    const parsedAmount = Number(amount);
    
    // --- Validation ---
    
    // 💡 VALIDATION: Check Minimum Amount
    if (parsedAmount < MINIMUM_WITHDRAW_AMOUNT) {
        return Swal.fire("Error", `The minimum withdrawal amount is $${MINIMUM_WITHDRAW_AMOUNT}.`, "error");
    }
    
    // Check if the amount is valid (positive number)
    if (!parsedAmount || parsedAmount <= 0) {
      return Swal.fire("Error", "Invalid withdraw amount. Amount must be positive.", "error");
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white  text-black w-full max-w-lg rounded-3xl p-6 relative shadow-2xl transform transition-all duration-300 scale-100 opacity-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-500 bg-gray-100 hover:bg-gray-200 transition z-10"
        >
          <X size={20} />
        </button>

        {/* Gradient Header */}
        <div className="flex items-center gap-3 mb-8 pb-3 border-b border-gray-100">
            <DollarSign size={28} className="text-indigo-600"/>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
              Process Payout
            </h2>
        </div>

        {/* Floating Balance Card */}
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl mb-6 flex justify-between items-center shadow-inner">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-indigo-700">Available Balance:</span>
            </div>
            <p className="text-2xl font-black text-indigo-900">
                ${balance}
            </p>
        </div>


        {/* Amount Input */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Withdraw
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-extrabold">$</span>
            <input
              type="number"
              min={MINIMUM_WITHDRAW_AMOUNT} 
              placeholder={`Enter minimum $${MINIMUM_WITHDRAW_AMOUNT}`} 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition duration-150 text-lg font-semibold"
            />
          </div>
          
          {/* Minimum Amount Warning */}
          {Number(amount) > 0 && Number(amount) < MINIMUM_WITHDRAW_AMOUNT && (
             <p className="text-orange-500 text-xs mt-1 font-medium">
                Minimum withdrawal amount must be ${MINIMUM_WITHDRAW_AMOUNT}.
             </p>
          )}

          {/* Insufficient Balance Warning */}
          {Number(amount) > balance && (
             <p className="text-red-500 text-xs mt-1 font-medium">
                ⚠️ Withdrawal amount cannot exceed available balance ($ {balance}).
             </p>
          )}
        </div>

        {/* Method Tabs (Pill Style) */}
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Payout Method
            </label>
            <div className="grid grid-cols-4 gap-2 bg-gray-100 p-1 rounded-full">
              {METHODS.map((m) => {
                const Icon = getMethodIcon(m);
                return (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`flex items-center justify-center py-2.5 rounded-full font-semibold text-sm transition duration-200 ${
                      method === m
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : "text-gray-600 hover:bg-white/50"
                    }`}
                  >
                    <Icon size={16} className="mr-1 hidden sm:inline" />
                    {m.toUpperCase()}
                  </button>
                );
              })}
            </div>
        </div>

        {/* Saved Notice */}
        {isSavedMethod && (
          <p className="text-sm text-green-800 bg-green-100 p-3 rounded-xl mb-4 flex items-center gap-2 font-medium border border-green-200">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            Saved method loaded. These fields are locked for security.
          </p>
        )}

        {/* Dynamic Fields Container */}
        <div className="space-y-4 mb-6 pt-2">
          {/* bkash / nagad */}
          {(method === "bkash" || method === "nagad") && (
            <input
              disabled={isSavedMethod}
              value={form.wallet}
              onChange={(e) => handleFormChange('wallet', e.target.value)}
              placeholder={`${method.toUpperCase()} Wallet Number`}
              className={`w-full px-4 py-3 border rounded-xl transition ${
                isSavedMethod ? "bg-gray-100 cursor-not-allowed text-gray-600" : "focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              }`}
            />
          )}

          {/* bank */}
          {method === "bank" && (
            <>
              <input disabled={isSavedMethod} value={form.bankName} onChange={(e) => handleFormChange('bankName', e.target.value)} placeholder="Bank Name (Required)" className={`w-full px-4 py-3 border rounded-xl transition ${isSavedMethod ? "bg-gray-100 cursor-not-allowed text-gray-600" : "focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"}`}/>
              <input disabled={isSavedMethod} value={form.accountName} onChange={(e) => handleFormChange('accountName', e.target.value)} placeholder="Account Name (Required)" className={`w-full px-4 py-3 border rounded-xl transition ${isSavedMethod ? "bg-gray-100 cursor-not-allowed text-gray-600" : "focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"}`}/>
              <input disabled={isSavedMethod} value={form.accountNo} onChange={(e) => handleFormChange('accountNo', e.target.value)} placeholder="Account Number (Required)" className={`w-full px-4 py-3 border rounded-xl transition ${isSavedMethod ? "bg-gray-100 cursor-not-allowed text-gray-600" : "focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"}`}/>
              <input disabled={isSavedMethod} value={form.branch} onChange={(e) => handleFormChange('branch', e.target.value)} placeholder="Branch Name (Optional)" className={`w-full px-4 py-3 border rounded-xl transition ${isSavedMethod ? "bg-gray-100 cursor-not-allowed text-gray-600" : "focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"}`}/>
            </>
          )}

          {/* crypto */}
          {method === "crypto" && (
            <>
              <select disabled={isSavedMethod} value={form.network} onChange={(e) => handleFormChange('network', e.target.value)} className={`w-full px-4 py-3 border rounded-xl transition appearance-none ${isSavedMethod ? "bg-gray-100 cursor-not-allowed text-gray-600" : "focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"}`}>
                <option value="USDT-TRC20">USDT (TRC20 Network)</option>
                <option value="USDT-BEP20">USDT (BEP20 Network)</option>
              </select>

              <input disabled={isSavedMethod} value={form.cryptoAddress} onChange={(e) => handleFormChange('cryptoAddress', e.target.value)} placeholder="USDT Wallet Address" className={`w-full px-4 py-3 border rounded-xl transition ${isSavedMethod ? "bg-gray-100 cursor-not-allowed text-gray-600" : "focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"}`}/>
            </>
          )}
        </div>

        {/* Save Checkbox (Only shown if method is NOT already saved) */}
        {!isSavedMethod && (
          <label className="flex items-center gap-3 text-sm mb-6 text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={saveMethod}
              onChange={() => setSaveMethod(!saveMethod)}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium">Save this payout method for future withdrawals.</span>
          </label>
        )}

        {/* Submit Button */}
        <button
          onClick={submitWithdraw}
          disabled={isSubmitting || Number(amount) < MINIMUM_WITHDRAW_AMOUNT || Number(amount) > balance}
          className={`w-full py-3 rounded-xl font-bold text-lg transition duration-300 transform shadow-lg ${
            isSubmitting || Number(amount) < MINIMUM_WITHDRAW_AMOUNT || Number(amount) > balance
              ? "bg-gray-400 cursor-not-allowed text-gray-200 shadow-none"
              : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.01] shadow-indigo-300/50"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin mx-auto h-6 w-6" />
          ) : (
            "Submit Withdraw Request"
          )}
        </button>
      </div>
    </div>
  );
}