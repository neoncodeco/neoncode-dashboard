"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { Copy, ImagePlus, Landmark, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useAdminDashboardCache } from "@/hooks/useAdminDashboardCache";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import {
  createDefaultBankPaymentDetails,
  createEmptyBankDetail,
  getBankLogoSrc,
} from "@/lib/bankDetails";

const DETAIL_FIELDS = [
  { key: "bankName", label: "Bank Name", placeholder: "Bank Name" },
  { key: "accountName", label: "Account Name", placeholder: "Account Name" },
  { key: "accountNumber", label: "Account Number", placeholder: "Account Number" },
  { key: "branch", label: "Branch", placeholder: "Branch" },
  { key: "district", label: "District", placeholder: "District" },
  { key: "routingNumber", label: "Routing Number", placeholder: "Routing Number" },
  { key: "swiftCode", label: "SWIFT Code", placeholder: "SWIFT Code" },
  { key: "reference", label: "Reference / Note", placeholder: "Reference / Note" },
];

export default function PaymentDetailsPage() {
  const { token } = useFirebaseAuth();
  const { getCache, setCache } = useAdminDashboardCache();
  const [bankPaymentDetails, setBankPaymentDetails] = useState(createDefaultBankPaymentDetails());
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogoId, setUploadingLogoId] = useState("");

  const loadPaymentDetails = useCallback(async () => {
    if (!token) return;
    const cachedDetails = getCache("admin-payment-details:list");
    if (cachedDetails) {
      setBankPaymentDetails(cachedDetails);
      setInitialLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load payment details.");
      }

      const nextDetails =
        data.bankPaymentDetails?.length ? data.bankPaymentDetails : createDefaultBankPaymentDetails();

      setBankPaymentDetails(nextDetails);
      setCache("admin-payment-details:list", nextDetails);
    } catch (error) {
      console.error("Payment details load error:", error);
      Swal.fire({
        icon: "error",
        title: "Load failed",
        text: "Could not load payment details right now.",
      });
    } finally {
      setInitialLoading(false);
    }
  }, [getCache, setCache, token]);

  useEffect(() => {
    loadPaymentDetails();
  }, [loadPaymentDetails]);

  const addBankDetail = () => {
    setBankPaymentDetails((prev) => [...prev, createEmptyBankDetail()]);
  };

  const removeBankDetail = (id) => {
    setBankPaymentDetails((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length ? next : createDefaultBankPaymentDetails();
    });
  };

  const updateBankDetail = (id, key, value) => {
    setBankPaymentDetails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  const copyValue = async (label, value) => {
    if (!String(value || "").trim()) {
      Swal.fire({
        icon: "warning",
        title: "Nothing to copy",
        text: `${label} is empty.`,
        timer: 1200,
        showConfirmButton: false,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(String(value));
      Swal.fire({
        icon: "success",
        title: "Copied",
        text: `${label} copied.`,
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Copy failed",
        text: `Could not copy ${label.toLowerCase()}.`,
      });
    }
  };

  const handleLogoUpload = async (detailId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    setUploadingLogoId(detailId);

    try {
      const response = await fetch("/api/upload/screenshot", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Logo upload failed.");
      }

      updateBankDetail(detailId, "logoUrl", data.url);
      Swal.fire({
        icon: "success",
        title: "Logo uploaded",
        text: "Bank logo uploaded and ready to save.",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Logo upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: error.message || "Could not upload bank logo.",
      });
    } finally {
      setUploadingLogoId("");
    }
  };

  const savePaymentDetails = async () => {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bankPaymentDetails }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save payment details.");
      }

      setCache("admin-payment-details:list", bankPaymentDetails);

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Payment details saved successfully.",
        timer: 1400,
        showConfirmButton: false,
      });
      await loadPaymentDetails();
    } catch (error) {
      console.error("Payment details save error:", error);
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: error.message || "Could not save payment details.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081227] text-white">
        <Loader2 className="mr-2 animate-spin" /> Loading payment details...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#081227] p-4 font-sans text-slate-200 md:p-8">
      <div className="mx-auto w-full space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-[#1e2d4d] bg-[#0d1d3b] p-8 shadow-xl md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white md:text-4xl">
              Payment Details
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-400">
              Bank payment information stays on its own page now. Each field has a separate
              copy button so admin can copy one item at a time.
            </p>
          </div>
          <button
            type="button"
            onClick={addBankDetail}
            className="flex items-center gap-2 rounded-2xl border border-[#9fb8e6] bg-[#eef4ff] px-6 py-3 font-bold text-[#183153] transition hover:border-[#bfd0ef] hover:bg-white"
          >
            <Plus size={18} /> Add Bank Detail
          </button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {bankPaymentDetails.map((detail, index) => (
              <div
                key={detail.id}
                className="rounded-[2rem] border border-[#1e2d4d] bg-[#0d1d3b] p-6 shadow-2xl"
              >
                <div className="mb-6 flex flex-col gap-4 border-b border-[#1e2d4d] pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Image
                      src={getBankLogoSrc(detail)}
                      alt={detail.bankName || "Bank"}
                      width={56}
                      height={56}
                      unoptimized={Boolean(detail.logoUrl)}
                      className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
                    />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                        Bank #{index + 1}
                      </p>
                      <h2 className="text-lg font-black text-white">
                        {detail.bankName || "New Bank"}
                      </h2>
                      <p className="mt-1 text-xs text-slate-400">
                        {detail.logoUrl ? "Custom logo uploaded" : "Auto logo fallback active"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-2xl border border-[#a9bfeb] bg-[#f6f9ff] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1f3b63] transition hover:border-[#c7d5f1] hover:bg-white">
                      {uploadingLogoId === detail.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ImagePlus size={14} />
                      )}
                      {uploadingLogoId === detail.id ? "Uploading" : "Upload Logo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          handleLogoUpload(detail.id, file);
                          event.target.value = "";
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => updateBankDetail(detail.id, "logoUrl", "")}
                      className="inline-flex items-center gap-2 self-start rounded-2xl border border-[#f2d28b] bg-[#fff7df] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#8a5a00] transition hover:border-[#f5ddaa] hover:bg-[#fffaf0]"
                    >
                      <ImagePlus size={14} /> Reset Logo
                    </button>

                    <button
                      type="button"
                      onClick={() => removeBankDetail(detail.id)}
                      className="inline-flex items-center gap-2 self-start rounded-2xl border border-[#f0b6b6] bg-[#fff1f1] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#cc4b4b] transition hover:border-[#f5caca] hover:bg-[#fff8f8]"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {DETAIL_FIELDS.map((field) => (
                    <div
                      key={`${detail.id}-${field.key}`}
                      className={field.wide || field.key === "reference" ? "md:col-span-2" : ""}
                    >
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                        {field.label}
                      </label>
                      <div className="flex gap-2">
                        <input
                          placeholder={field.placeholder}
                          value={detail[field.key] || ""}
                          onChange={(event) =>
                            updateBankDetail(detail.id, field.key, event.target.value)
                          }
                          className="w-full rounded-2xl border border-[#1e2d4d] bg-[#081227] p-4 text-sm font-semibold text-white outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => copyValue(field.label, detail[field.key])}
                          className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl border border-[#b5c8ef] bg-[#f4f8ff] text-[#365a92] transition hover:border-[#d0dcf5] hover:bg-white hover:text-[#244978]"
                          aria-label={`Copy ${field.label}`}
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-[#1e2d4d] bg-[#0d1d3b] p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                  <Landmark size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Payment Info
                  </p>
                  <h3 className="text-lg font-black text-white">Copy One Field At A Time</h3>
                </div>
              </div>
              <div className="space-y-3 text-sm font-medium text-slate-400">
                <p>Each input has its own copy button.</p>
                <p>Admin can upload a local logo file and it will be stored via imgbb.</p>
                <p>Saved data appears across user payment sections.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={savePaymentDetails}
              disabled={saving}
              className="flex w-full items-center justify-center gap-3 rounded-[2rem] border border-[#b1c6ef] bg-[#eef5ff] px-6 py-5 text-base font-black text-[#183153] shadow-xl transition-all hover:-translate-y-1 hover:bg-white active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Save Payment Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
