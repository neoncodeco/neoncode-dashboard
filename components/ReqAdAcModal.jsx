"use client";

import { useRef, useState } from 'react';
import { Tag, KeyRound, Clock, Facebook, Mail, Info, X, ChevronDown } from 'lucide-react';
import useFirebaseAuth from '@/hooks/useFirebaseAuth';
import { normalizeAssignedAccounts } from "@/lib/adAccountRequests";

// Timezones
const timezones = [
  { value: 'BST', label: 'Bangladesh Standard Time (BST)' },
  { value: 'EST', label: 'Eastern Standard Time (EST)' },
  { value: 'GMT', label: 'Greenwich Mean Time (GMT)' },
  { value: 'PST', label: 'Pacific Standard Time (PST)' },
];

// Reusable Input Component
const InputField = ({ label, name, type = "text", icon: Icon, required = true, placeholder, helpText, prefix, formData, handleChange, rowIndex = 0 }) => {
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
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-slate-700">
        {label}{" "}
        {!required && <span className="text-xs font-medium text-slate-500">(Optional)</span>}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {prefix ? (
            <span className="font-semibold text-slate-500">{prefix}</span>
          ) : (
            Icon && <Icon className="h-5 w-5 text-slate-400" />
          )}
        </div>

        <input
          ref={type === "date" ? dateInputRef : null}
          type={type}
          name={name}
          data-row-index={rowIndex}
          placeholder={placeholder}
          required={required}
          value={formData[name]}
          onChange={handleChange}
          onClick={type === "date" ? openDatePicker : undefined}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 pl-10 text-sm font-semibold text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(15,23,42,0.05)] outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      {helpText && <p className="text-xs font-semibold text-slate-500">{helpText}</p>}
    </div>
  );
};

export default function ReqAdAcModal({ isOpen, onClose }) {
  const { user, token } = useFirebaseAuth();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center  p-6 backdrop-blur-[10px]">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_36px_90px_rgba(2,6,23,0.5)] transition-all [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] px-6 py-2">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Request New Ad Account</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Meta account request form</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-8 w-8 bg-[#C2EB2D] p-1 rounded-full" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">

          {statusMessage.message && (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm
              ${statusMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {statusMessage.message}
            </div>
          )}

          {/* Info */}
          <div className="flex items-start rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(190,227,119,0.28),rgba(236,253,245,0.9))] p-4 text-sm font-semibold text-emerald-900 shadow-[0_8px_20px_rgba(16,185,129,0.1)]">
            <Info className="mr-3 mt-0.5 h-5 w-5" />
            Please provide accurate information. BM ID and Monthly Budget are required.
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {requestRows.map((row, rowIndex) => (
                <div key={rowIndex} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <h3 className="text-sm font-black text-slate-900">Account {rowIndex + 1}</h3>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      placeholder="Enter BM ID"
                      helpText="15-16 digit Business Manager ID"
                      formData={row}
                      handleChange={handleChange}
                      rowIndex={rowIndex}
                    />

                    {/* Timezone */}
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Timezone</label>

                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <select
                          name="timezone"
                          data-row-index={rowIndex}
                          value={row.timezone}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 p-3 pl-10 pr-10 text-sm font-semibold text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(15,23,42,0.05)] outline-none transition-all focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
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
                      placeholder="Minimum 100"
                      helpText="Required minimum monthly spend."
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

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={addRequestRow}
                className="rounded-2xl border border-emerald-300 bg-[linear-gradient(180deg,#f3fff0_0%,#e6f9dd_100%)] px-4 py-3 text-sm font-black text-emerald-700 shadow-[0_8px_20px_rgba(163,230,53,0.18)] transition hover:brightness-105"
              >
                + Add Another Account
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !user}
              className="w-full rounded-2xl bg-[#C2EB2D] px-4 py-3 text-sm font-black text-slate-900 shadow-[0_16px_28px_rgba(194,235,45,0.34)] transition hover:brightness-105 disabled:opacity-50"
            >
              {loading ? "Processing..." : !user ? "Log in to submit" : "Submit Request"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
