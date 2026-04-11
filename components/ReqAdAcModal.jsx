"use client";

import { useRef, useState } from 'react';
import { Tag, KeyRound, Clock, Facebook, Mail, Info, X, ChevronDown, Calendar } from 'lucide-react';
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
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-800">
        {label}{" "}
        {!required && <span className="text-xs text-gray-500 font-normal">(Optional)</span>}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {prefix ? (
            <span className="text-gray-500">{prefix}</span>
          ) : (
            Icon && <Icon className="h-5 w-5 text-gray-400" />
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
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pl-10 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
        />
      </div>

      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Request New Ad Account</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {statusMessage.message && (
            <div className={`p-4 rounded-lg text-sm border 
              ${statusMessage.type === "success"
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-red-100 text-red-700 border-red-200"
              }`}
            >
              {statusMessage.message}
            </div>
          )}

          {/* Info */}
          <div className="flex items-start p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg text-blue-800 text-sm">
            <Info className="h-5 w-5 mr-3 mt-0.5" />
            Please provide accurate information. BM ID and Monthly Budget are required.
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {requestRows.map((row, rowIndex) => (
                <div key={rowIndex} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-gray-900">Account {rowIndex + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeRequestRow(rowIndex)}
                      disabled={requestRows.length === 1}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-600 disabled:opacity-40"
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
                      <label className="text-sm font-medium text-gray-800">Timezone</label>

                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />

                        <select
                          name="timezone"
                          data-row-index={rowIndex}
                          value={row.timezone}
                          onChange={handleChange}
                          className="w-full bg-gray-50 border text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-blue-100 border-gray-300 rounded-xl p-3 pl-10 pr-10 text-sm focus:ring-2 focus:ring-blue-500"
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

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addRequestRow}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                + Add Another Account
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !user}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition shadow-md disabled:opacity-50"
            >
              {loading ? "Processing..." : !user ? "Log in to submit" : "Submit Request"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
