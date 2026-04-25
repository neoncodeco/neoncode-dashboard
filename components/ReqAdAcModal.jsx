"use client";

import { useRef, useState } from 'react';
import { Tag, KeyRound, Clock, Facebook, Mail, X, ChevronDown } from 'lucide-react';
import useAppAuth from '@/hooks/useAppAuth';
import { normalizeAssignedAccounts } from "@/lib/adAccountRequests";

const MIN_MONTHLY_BUDGET_USD = 100;

// Timezones
const timezones = [
  { value: 'BST', label: 'Bangladesh Standard Time (BST)' },
  { value: 'EST', label: 'Eastern Standard Time (EST)' },
  { value: 'GMT', label: 'Greenwich Mean Time (GMT)' },
  { value: 'PST', label: 'Pacific Standard Time (PST)' },
];

// Reusable Input Component
const InputField = ({ label, name, type = "text", icon: Icon, required = true, placeholder, helpText, prefix, formData, handleChange, rowIndex = 0, min, max, step }) => {
  const dateInputRef = useRef(null);

  const openDatePicker = () => {
    if (type !== "date") return;
    const input = dateInputRef.current;
    if (!input) return;

    input.focus();
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  };

  return (
    <div className="space-y-0.5 sm:space-y-1.5">
      <label className="block text-[11px] font-bold leading-tight text-slate-700 sm:text-sm">
        {label}{" "}
        {!required && <span className="text-[10px] font-medium text-slate-500 sm:text-xs">(Optional)</span>}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 sm:left-3">
          {prefix ? (
            <span className="text-xs font-semibold text-slate-500 sm:text-base">{prefix}</span>
          ) : (
            Icon && <Icon className="h-3.5 w-3.5 text-slate-400 sm:h-5 sm:w-5" />
          )}
        </div>

        <input
          ref={type === "date" ? dateInputRef : null}
          type={type}
          name={name}
          data-row-index={rowIndex}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          value={formData[name]}
          onChange={handleChange}
          onClick={type === "date" ? openDatePicker : undefined}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs font-semibold text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(15,23,42,0.05)] outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-emerald-300 focus:ring-1 focus:ring-emerald-100 sm:rounded-2xl sm:py-2.5 sm:pl-10 sm:pr-3 sm:text-sm sm:focus:ring-4"
        />
      </div>

      {helpText && (
        <p className="text-[10px] font-semibold leading-snug text-slate-500 sm:mt-0.5 sm:text-xs">{helpText}</p>
      )}
    </div>
  );
};

export default function ReqAdAcModal({ isOpen, onClose }) {
  const { user, token } = useAppAuth();

  const createEmptyRequest = () => ({
    accountName: "",
    bmId: "",
    timezone: "BST",
    facebookPage: "",
    email: "",
    monthlyBudget: 100,
    startDate: "",
  });

  const [requestRows, setRequestRows] = useState([createEmptyRequest()]);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const rowIndex = Number(e.target.dataset.rowIndex || 0);
    setRequestRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [name]: value };
      return next;
    });
  };

  const addRequestRow = () => {
    setRequestRows((prev) => [...prev, createEmptyRequest()]);
  };

  const removeRequestRow = (index) => {
    setRequestRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", message: "" });
    setLoading(true);

    if (!token) {
      setStatusMessage({
        type: "error",
        message: "Authentication failed. Please log in again.",
      });
      setLoading(false);
      return;
    }

    for (let i = 0; i < requestRows.length; i += 1) {
      const row = requestRows[i];
      const bmId = String(row?.bmId ?? "").trim();
      const budgetRaw = row?.monthlyBudget;
      const budget = typeof budgetRaw === "number" ? budgetRaw : Number(String(budgetRaw ?? "").trim());

      if (!bmId) {
        setStatusMessage({
          type: "error",
          message: `Account ${i + 1}: Business Manager ID is required.`,
        });
        setLoading(false);
        return;
      }

      if (!Number.isFinite(budget) || budget < MIN_MONTHLY_BUDGET_USD) {
        setStatusMessage({
          type: "error",
          message: `Account ${i + 1}: Monthly budget is required (minimum $${MIN_MONTHLY_BUDGET_USD} USD).`,
        });
        setLoading(false);
        return;
      }
    }

    try {
      const assignedAccounts = normalizeAssignedAccounts(requestRows);
      const res = await fetch("/api/ads-request/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...assignedAccounts[0],
          assignedAccounts,
          monthlyBudget: Number(assignedAccounts[0]?.monthlyBudget || 0),
          accountName: assignedAccounts[0]?.accountName || "",
          bmId: assignedAccounts[0]?.bmId || "",
          timezone: assignedAccounts[0]?.timezone || "BST",
          facebookPage: assignedAccounts[0]?.facebookPage || "",
          email: assignedAccounts[0]?.email || "",
          startDate: assignedAccounts[0]?.startDate || "",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage({
          type: "success",
          message: data.message || "Request submitted successfully!",
        });

        setRequestRows([createEmptyRequest()]);
      } else {
        setStatusMessage({
          type: "error",
          message: data.message || "Submission failed.",
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        message: "Server error. Try again.",
      });
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] backdrop-blur-[10px] sm:px-6 sm:py-6 sm:pb-6">
      <div className="max-h-[calc(100dvh-env(safe-area-inset-bottom,0px)-6rem)] w-full max-w-[min(100%,42rem)] overflow-y-auto rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_36px_90px_rgba(2,6,23,0.5)] transition-all [scrollbar-width:none] [-ms-overflow-style:none] sm:max-h-[min(90vh,880px)] sm:max-w-4xl sm:rounded-[30px] [&::-webkit-scrollbar]:hidden">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] px-4 py-1.5 sm:gap-3 sm:px-6 sm:py-2">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black tracking-tight text-slate-900 sm:text-2xl">Request New Ad Account</h2>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:mt-1 sm:text-xs sm:tracking-[0.14em]">Meta account request form</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="shrink-0 rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 sm:p-2"
          >
            <X className="h-7 w-7 rounded-full bg-[#C2EB2D] p-1 sm:h-8 sm:w-8" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-3 sm:space-y-5 sm:p-6">

          {statusMessage.message && (
            <div className={`rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm
              ${statusMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {statusMessage.message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-5">
            <div className="space-y-1.5 sm:space-y-3">
              {requestRows.map((row, rowIndex) => (
                <div key={rowIndex} className="space-y-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:space-y-3 sm:rounded-3xl sm:p-5">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 sm:px-3 sm:py-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <h3 className="text-xs font-black text-slate-900 sm:text-sm">Account {rowIndex + 1}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRequestRow(rowIndex)}
                      disabled={requestRows.length === 1}
                      className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1 sm:gap-2.5 md:grid-cols-2 md:gap-4">
                    <InputField
                      label="Account Name"
                      name="accountName"
                      icon={Tag}
                      placeholder="Enter account name"
                      helpText="Example: Quraner Alo Promo"
                      formData={row}
                      handleChange={handleChange}
                      rowIndex={rowIndex}
                    />

                    <InputField
                      label="Business Manager ID"
                      name="bmId"
                      icon={KeyRound}
                      required
                      placeholder="Enter BM ID"
                      helpText="15-16 digit Business Manager ID"
                      formData={row}
                      handleChange={handleChange}
                      rowIndex={rowIndex}
                    />

                    {/* Timezone */}
                    <div className="space-y-0.5 sm:space-y-1.5">
                      <label className="text-[11px] font-bold leading-tight text-slate-700 sm:text-sm">Timezone</label>

                      <div className="relative">
                        <Clock className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 sm:left-3 sm:h-5 sm:w-5" />
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400 sm:right-3 sm:h-4 sm:w-4" />

                        <select
                          name="timezone"
                          data-row-index={rowIndex}
                          value={row.timezone}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-xs font-semibold text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(15,23,42,0.05)] outline-none transition-all focus:bg-white focus:border-emerald-300 focus:ring-1 focus:ring-emerald-100 sm:rounded-2xl sm:p-3 sm:pl-10 sm:pr-10 sm:text-sm sm:focus:ring-4"
                        >
                          {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <InputField
                      label="Monthly Budget (USD)"
                      name="monthlyBudget"
                      type="number"
                      prefix="$"
                      required
                      min={MIN_MONTHLY_BUDGET_USD}
                      step={1}
                      placeholder="Minimum 100"
                      helpText={`Required — minimum $${MIN_MONTHLY_BUDGET_USD} USD per month.`}
                      formData={row}
                      handleChange={handleChange}
                      rowIndex={rowIndex}
                    />

                    <InputField
                      label="Start Date"
                      name="startDate"
                      type="date"
                      placeholder="Pick a date"
                      helpText="When should it be ready?"
                      formData={row}
                      handleChange={handleChange}
                      rowIndex={rowIndex}
                    />

                    <InputField
                      label="Facebook Page URL"
                      name="facebookPage"
                      icon={Facebook}
                      required={false}
                      placeholder="https://facebook.com/page"
                      formData={row}
                      handleChange={handleChange}
                      rowIndex={rowIndex}
                    />

                    <InputField
                      label="Contact Email"
                      name="email"
                      icon={Mail}
                      required={false}
                      type="email"
                      placeholder="example@email.com"
                      formData={row}
                      handleChange={handleChange}
                      rowIndex={rowIndex}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-0 sm:gap-2 sm:pt-1">
              <button
                type="button"
                onClick={addRequestRow}
                className="rounded-xl border border-emerald-300 bg-[linear-gradient(180deg,#f3fff0_0%,#e6f9dd_100%)] px-3 py-2 text-xs font-black text-emerald-700 shadow-[0_8px_20px_rgba(163,230,53,0.18)] transition hover:brightness-105 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              >
                + Add Another Account
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !user}
              className="w-full rounded-xl bg-[#C2EB2D] px-4 py-2.5 text-xs font-black text-slate-900 shadow-[0_16px_28px_rgba(194,235,45,0.34)] transition hover:brightness-105 disabled:opacity-50 sm:rounded-2xl sm:py-3 sm:text-sm"
            >
              {loading ? "Processing..." : !user ? "Log in to submit" : "Submit Request"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
