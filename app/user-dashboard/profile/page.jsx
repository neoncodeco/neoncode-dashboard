"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera, User, Mail, Phone, Save, Loader2,
  CheckCircle, Shield, BadgeCheck,
  ArrowRight, Globe, History, LogOut, MessageSquareText, Sparkles,
} from "lucide-react";
import useAppAuth from "@/hooks/useAppAuth";
import Swal from "sweetalert2";
import { userDashboardRoutes } from "@/lib/userDashboardRoutes";

export default function FullProfilePage() {
  const { userData, token, refreshUser, logout } = useAppAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpStatus, setOtpStatus] = useState({ type: "", message: "" });
  const [hasPendingOtp, setHasPendingOtp] = useState(false);
  const [isLocallyPhoneVerified, setIsLocallyPhoneVerified] = useState(false);
  const [isEditingVerifiedPhone, setIsEditingVerifiedPhone] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    photo: "",
    coverPhoto: "",
  });
  const [verificationForm, setVerificationForm] = useState({
    whatsappNumber: "",
    code: "",
  });
  const [paymentMethods, setPaymentMethods] = useState({});

  useEffect(() => {
    if (typeof window === "undefined" || !userData) return;
    if (window.location.hash !== "#whatsapp-verify") return;
    const el = document.getElementById("whatsapp-verify");
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [userData]);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        photo: userData.photo || "",
        coverPhoto: userData.coverPhoto || "",
      });

      setVerificationForm((prev) => ({
        ...prev,
        whatsappNumber: isEditingVerifiedPhone
          ? prev.whatsappNumber
          : userData.whatsappNumber || userData.phone || prev.whatsappNumber || "",
      }));

      setPaymentMethods(userData.payoutMethods || {});
    }
  }, [isEditingVerifiedPhone, userData]);

  const hasVerifiedPhone = Boolean(userData?.phoneVerification?.verified || isLocallyPhoneVerified);
  const isPhoneVerified = hasVerifiedPhone && !isEditingVerifiedPhone;
  const isOtpSent =
    hasPendingOtp || (!hasVerifiedPhone && userData?.phoneVerification?.status === "pending");
  const displayedWhatsappNumber = (
    isPhoneVerified
      ? userData?.whatsappNumber || userData?.phone || verificationForm.whatsappNumber
      : verificationForm.whatsappNumber
  ).replace(/^880/, "");

  const saveProfile = async (nextFormData, nextPaymentMethods, options = {}) => {
    const { silent = false, successMessage = "Profile updated successfully!" } = options;
    if (!token) return false;
    if (!silent) {
      setLoading(true);
      setStatus({ type: "", message: "" });
    }

    try {
      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...nextFormData,
          payoutMethods: nextPaymentMethods,
        }),
      });

      if (res.ok) {
        setStatus({ type: "success", message: successMessage });
        await refreshUser();
        return true;
      }

      setStatus({ type: "error", message: "Update failed" });
      return false;
    } catch (error) {
      setStatus({ type: "error", message: "Error occurred!" });
      return false;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleImageUpload = async (e, target = "photo") => {
    const file = e.target.files[0];
    if (!file) return;
    if (target === "cover") {
      setUploadingCover(true);
    } else {
      setUploadingPhoto(true);
    }
    const uploadData = new FormData();
    uploadData.append("image", file);

    try {
      const res = await fetch("/api/upload/screenshot", { method: "POST", body: uploadData });
      const data = await res.json();
      if (data.url) {
        const key = target === "cover" ? "coverPhoto" : "photo";
        const nextFormData = { ...formData, [key]: data.url };
        setFormData(nextFormData);
        await saveProfile(nextFormData, paymentMethods, {
          silent: true,
          successMessage: target === "cover" ? "Cover photo updated." : "Profile photo updated.",
        });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Upload failed" });
    } finally {
      if (target === "cover") {
        setUploadingCover(false);
      } else {
        setUploadingPhoto(false);
      }
    }
  };

  const handlePaymentChange = (methodKey, value) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [methodKey]: { ...prev[methodKey], number: value },
    }));
  };

  //   if (!token) return;

  //   setOtpLoading(true);
  //   setOtpStatus({ type: "", message: "" });

  //   try {
  //     const res = await fetch("/api/otp/send-otp", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         phone: verificationForm.whatsappNumber,
  //       }),
  //     });

  //     const data = await res.json();

  //     if (!res.ok || !data?.ok) {
  //       setOtpStatus({ type: "error", message: data?.error || "Failed to send OTP." });
  //       return;
  //     }

  //     const successMessage = data?.devOtp
  //       ? `Local test OTP: ${data.devOtp}${data?.providerError ? ` (${data.providerError})` : ""}`
  //       : data.message || "OTP sent to your number.";

  //     setOtpStatus({ type: "success", message: successMessage });
  //     await refreshUser();
  //   } catch (error) {
  //     setOtpStatus({ type: "error", message: "Failed to send OTP." });
  //   } finally {
  //     setOtpLoading(false);
  //   }
  // };

//  send otp
  const normalizeWhatsappInput = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("880")) return digits;
    if (digits.startsWith("0")) return `88${digits}`;
    if (digits.startsWith("1") && digits.length === 10) return `880${digits}`;
    return digits;
  };

  const isValidBdWhatsapp = (value) => /^8801\d{9}$/.test(value);

  const handleCancelChangeWhatsapp = () => {
    setIsEditingVerifiedPhone(false);
    setHasPendingOtp(false);
    setIsLocallyPhoneVerified(false);
    setVerificationForm((prev) => ({
      ...prev,
      whatsappNumber: userData?.whatsappNumber || userData?.phone || "",
      code: "",
    }));
    setOtpStatus({ type: "", message: "" });
  };

  const handleSendOtp = async () => {
    if (!token) return;

    const normalized = normalizeWhatsappInput(verificationForm.whatsappNumber);
    if (!normalized) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Enter your WhatsApp number first.",
      });
      return;
    }

    if (!isValidBdWhatsapp(normalized)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid format",
        text: "Use Bangladesh WhatsApp format: 8801XXXXXXXXX (11 digits after 880).",
      });
      return;
    }

    setVerificationForm((prev) => ({ ...prev, whatsappNumber: normalized }));

    setOtpLoading(true);

    try {
      const res = await fetch("/api/account/send-whatsapp-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          whatsappNumber: normalized,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: data?.error || "Failed to send verification code",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Code sent",
        text: data?.message || "Check your WhatsApp for the verification code.",
        timer: 2200,
        showConfirmButton: false,
      });

      setHasPendingOtp(true);
      setIsLocallyPhoneVerified(false);
      setOtpStatus({ type: "success", message: data?.message || "OTP sent successfully." });
      await refreshUser();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Try again later",
      });
    } finally {
      setOtpLoading(false);
    }
  };
const handleVerifyOtp = async () => {
  if (verifyingOtp) return;
  if (!token) return;

  if (!verificationForm.code) {
    Swal.fire({
      icon: "warning",
      title: "Enter OTP",
      text: "Please enter 6-digit code",
    });
    return;
  }

  setVerifyingOtp(true);

  try {
    const res = await fetch("/api/account/verify-whatsapp-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        code: verificationForm.code,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text: data?.error || "Verification failed",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Verified ✅",
      text: "Your number is successfully verified",
      timer: 2000,
      showConfirmButton: false,
    });

    setHasPendingOtp(false);
    setIsLocallyPhoneVerified(true);
    setIsEditingVerifiedPhone(false);

    setVerificationForm((prev) => ({
      ...prev,
      code: "",
    }));

    await refreshUser();

  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Verification failed",
    });
  } finally {
    setVerifyingOtp(false);
  }
};


  const handleUpdate = async (e) => {
    e.preventDefault();
    await saveProfile(formData, paymentMethods, { silent: false });
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout("/login");
    } catch (error) {
      setStatus({ type: "error", message: "Logout failed. Please try again." });
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="user-dashboard-theme-scope min-h-screen pb-20">
      <div
        className="relative mx-3 mt-3 h-56 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_14%_18%,rgba(194,235,45,0.5),transparent_30%),radial-gradient(circle_at_84%_24%,rgba(115,200,255,0.34),transparent_34%),linear-gradient(135deg,#7f9d33_0%,#c2eb2d_46%,#f2fad1_100%)] md:mx-6 2xl:mx-2 md:mt-4 md:h-72 md:rounded-[36px]"
        style={
          formData.coverPhoto
            ? {
                backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.45), rgba(2, 6, 23, 0.45)), url(${formData.coverPhoto})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <label className="absolute right-4 top-4 cursor-pointer rounded-xl bg-black/40 px-3 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-black/60">
          {uploadingCover ? "Uploading..." : "Change Cover"}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "cover")} />
        </label>
      </div>

      <div className="relative z-10 mx-auto -mt-14 w-full px-4 md:-mt-16 md:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-end md:gap-6">
          <div className="group relative">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-white p-1 shadow-2xl md:h-36 md:w-36">
              {formData.photo ? (
                <img src={formData.photo} alt="Profile" className="h-full w-full rounded-2xl object-cover object-center" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-100 text-gray-300">
                  <User size={50} />
                </div>
              )}
              {uploadingPhoto ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                  <Loader2 className="animate-spin text-white" />
                </div>
              ) : null}
            </div>
            <label className="absolute bottom-2 right-2 cursor-pointer rounded-xl bg-indigo-600 p-2 text-white shadow-lg transition hover:scale-110">
              <Camera size={18} />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "photo")} />
            </label>
          </div>
          <div className="dashboard-subpanel min-w-0 rounded-3xl border border-[var(--dashboard-frame-border)] px-4 py-3 font-medium md:px-5">
            <div className="flex items-center gap-2">
              <h1 className="dashboard-text-strong truncate text-2xl font-black md:text-3xl">{formData.name || "User"}</h1>
              {hasVerifiedPhone ? (
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-[0_6px_18px_rgba(14,165,233,0.35)] ring-2 ring-white/70 dark:ring-slate-900/80"
                  title="Verified account"
                >
                  <BadgeCheck size={15} strokeWidth={2.4} />
                </span>
              ) : null}
            </div>
            <p className="dashboard-text-muted mt-1 flex items-center gap-2 truncate text-sm md:text-base">
              <Mail size={14} /> {userData?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full grid-cols-1 gap-6 px-4 md:px-6 xl:grid-cols-12 xl:px-8">
        <div className="space-y-6 xl:col-span-4">
          <div className="dashboard-subpanel rounded-3xl border border-[var(--dashboard-frame-border)] p-6">
            <h3 className="dashboard-text-strong mb-4 flex items-center gap-2 font-bold">
              <Shield size={18} className="text-indigo-600" /> Account Info
            </h3>
            <div className="space-y-3">
              <div className="dashboard-subpanel flex justify-between rounded-2xl p-3 text-sm">
                <span className="dashboard-text-muted">Referral Code</span>
                <span className="font-black text-indigo-600">{userData?.referralCode}</span>
              </div>
              <div className="dashboard-subpanel flex justify-between rounded-2xl p-3 text-sm">
                <span className="dashboard-text-muted">Joined On</span>
                <span className="dashboard-text-strong font-medium">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="dashboard-subpanel flex justify-between rounded-2xl p-3 text-sm">
                <span className="dashboard-text-muted">Account Verification</span>
                <span className={`font-bold ${isPhoneVerified ? "text-green-600" : "text-amber-600"}`}>
                  {isPhoneVerified ? "Verified" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard-subpanel rounded-3xl border border-[var(--dashboard-frame-border)] p-6">
            <h3 className="dashboard-text-strong mb-4 flex items-center gap-2 font-bold">
              <Globe size={18} className="text-indigo-600" /> Quick Access
            </h3>
            <div className="space-y-3">
              <Link
                href={userDashboardRoutes.activity}
                className="dashboard-subpanel flex items-center justify-between rounded-2xl border border-[var(--dashboard-frame-border)] px-4 py-4 transition hover:border-indigo-200"
              >
                <div className="flex items-center gap-3">
                  <span className="dashboard-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl">
                    <History size={18} />
                  </span>
                  <div>
                    <p className="dashboard-text-strong font-bold">Activity</p>
                    <p className="dashboard-text-muted text-xs">View transactions, logs, and account activity</p>
                  </div>
                </div>
                <ArrowRight size={18} className="dashboard-text-faint" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="dashboard-subpanel flex w-full items-center justify-between rounded-2xl border border-[var(--dashboard-frame-border)] px-4 py-4 text-left transition hover:border-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <span className="dashboard-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl">
                    {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                  </span>
                  <div>
                    <p className="dashboard-text-strong font-bold">{isLoggingOut ? "Logging out..." : "Logout"}</p>
                    <p className="dashboard-text-muted text-xs">Sign out from this device safely</p>
                  </div>
                </div>
                <ArrowRight size={18} className="dashboard-text-faint" />
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8">
          <form onSubmit={handleUpdate} className="dashboard-subpanel space-y-10 rounded-3xl border border-[var(--dashboard-frame-border)] p-6 md:p-10">
            <section>
              <h3 className="dashboard-text-strong mb-6 flex items-center gap-2 text-lg font-bold">
                <User size={20} className="text-indigo-600" /> General Settings
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="dashboard-text-faint ml-1 text-xs font-bold uppercase">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="dashboard-text-strong w-full rounded-2xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] px-5 py-3.5 outline-none transition focus:border-[var(--dashboard-accent)]"
                  />
                </div>
                <div className="space-y-2 opacity-60">
                  <label className="dashboard-text-faint ml-1 text-xs font-bold uppercase">Email (Private)</label>
                  <input
                    type="email"
                    value={userData?.email || ""}
                    readOnly
                    className="w-full cursor-not-allowed rounded-2xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-panel-soft)] px-5 py-3.5 outline-none"
                  />
                </div>
              </div>
            </section>

            <section
              id="whatsapp-verify"
              className="scroll-mt-24 overflow-hidden rounded-[28px] border border-emerald-300/35 bg-[linear-gradient(135deg,rgba(183,223,105,0.18),rgba(115,200,255,0.12)_55%,rgba(255,255,255,0.95))] shadow-[0_18px_50px_rgba(15,23,42,0.09)]"
            >
              {/* Header */}
              <div className="relative overflow-hidden border-b border-emerald-200/40 px-4 py-4 sm:px-6 sm:py-5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top_left,rgba(183,223,105,0.28),transparent_60%)]" />
                <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="flex items-start gap-2.5 sm:gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(183,223,105,0.5),rgba(255,255,255,0.9))] shadow-[0_8px_20px_rgba(155,196,79,0.2)]">
                      <Shield size={20} className="text-emerald-700" />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                        <Sparkles size={10} />
                        Secure Verification
                      </span>
                      <h3 className="dashboard-text-strong mt-1 text-xl font-black tracking-tight sm:mt-1.5 sm:text-2xl">
                        Verify Your Account Number
                      </h3>
                      <p className="dashboard-text-muted mt-0.5 max-w-xl text-sm leading-snug sm:mt-1 sm:leading-6">
                        Verify your WhatsApp number via OTP to confirm your identity and receive important dashboard notifications.
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.12em] ${
                    isPhoneVerified
                      ? "border-emerald-300/60 bg-emerald-100/80 text-emerald-700"
                      : "border-amber-300/60 bg-amber-100/80 text-amber-700"
                  }`}>
                    <CheckCircle size={13} />
                    {isPhoneVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] xl:gap-4">
                  {/* WhatsApp number card */}
                  <div className="rounded-[20px] border border-emerald-200/50 bg-white/80 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-5">
                    <div className="mb-3 flex items-center gap-2.5 sm:mb-4 sm:gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(183,223,105,0.4),rgba(255,255,255,0.95))] shadow-sm">
                        <MessageSquareText size={17} className="text-emerald-700" />
                      </div>
                      <div>
                        <p className="dashboard-text-strong text-sm font-black tracking-tight">WhatsApp Number</p>
                        <p className="dashboard-text-muted text-[11px]">Format: 8801XXXXXXXXX</p>
                      </div>
                    </div>

                    <label className="dashboard-text-faint ml-1 text-[10px] font-black uppercase tracking-[0.16em]">Phone Number</label>
                    <div className="mt-1.5 flex items-center gap-1.5 rounded-[16px] border border-emerald-200/60 bg-[rgba(183,223,105,0.08)] px-3 py-2 sm:mt-2 sm:gap-2 sm:py-2.5 focus-within:border-emerald-400/70 focus-within:ring-2 focus-within:ring-emerald-200/40 transition">
                      <span className="inline-flex items-center rounded-xl border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">+880</span>
                      <input
                        type="text"
                        placeholder="1XXXXXXXXX"
                        value={displayedWhatsappNumber}
                        disabled={isPhoneVerified || isOtpSent}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setHasPendingOtp(false);
                          setIsLocallyPhoneVerified(false);
                          setVerificationForm((prev) => ({
                            ...prev,
                            whatsappNumber: rawValue ? `880${rawValue}` : "",
                            code: "",
                          }));
                          if (otpStatus.message) setOtpStatus({ type: "", message: "" });
                        }}
                        className="h-9 w-full border-0 bg-transparent p-0 text-sm font-semibold outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 disabled:opacity-60"
                      />
                    </div>

                    {hasVerifiedPhone && !isEditingVerifiedPhone ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingVerifiedPhone(true);
                          setHasPendingOtp(false);
                          setIsLocallyPhoneVerified(false);
                          setOtpStatus({ type: "", message: "" });
                          setVerificationForm((prev) => ({
                            ...prev,
                            code: "",
                            whatsappNumber:
                              userData?.whatsappNumber || userData?.phone || prev.whatsappNumber || "",
                          }));
                        }}
                        className="dashboard-muted-button mt-2 inline-flex min-h-10 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-bold transition sm:mt-3"
                      >
                        Change WhatsApp number
                      </button>
                    ) : null}
                    {isEditingVerifiedPhone ? (
                      <p className="dashboard-text-muted mt-2 text-xs leading-relaxed sm:mt-3">
                        Enter your new number, tap <span className="font-bold">Send Code</span>, then verify with the OTP.
                        Your account stays unverified until the new number is confirmed.
                      </p>
                    ) : null}
                    {isEditingVerifiedPhone && !isPhoneVerified ? (
                      <button
                        type="button"
                        onClick={handleCancelChangeWhatsapp}
                        className="dashboard-muted-button mt-2 inline-flex min-h-10 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition sm:mt-3"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>

                  {/* OTP card */}
                  {!isPhoneVerified ? (
                    <div className="rounded-[20px] border border-sky-200/50 bg-white/80 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-5">
                      <div className="mb-3 flex items-center gap-2.5 sm:mb-4 sm:gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,rgba(115,200,255,0.3),rgba(255,255,255,0.95))] shadow-sm">
                          <BadgeCheck size={17} className="text-sky-600" />
                        </div>
                        <div>
                          <p className="dashboard-text-strong text-sm font-black tracking-tight">One-Time Password</p>
                          <p className="dashboard-text-muted text-[11px]">6-digit security code</p>
                        </div>
                      </div>

                      <label className="dashboard-text-faint ml-1 text-[10px] font-black uppercase tracking-[0.16em]">OTP Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={verificationForm.code}
                        onChange={(e) => setVerificationForm((prev) => ({
                          ...prev,
                          code: e.target.value.replace(/\D/g, "").slice(0, 6),
                        }))}
                        className="mt-1.5 w-full rounded-[16px] border border-sky-200/60 bg-[rgba(115,200,255,0.07)] px-4 py-3 text-center text-base font-black tracking-[0.3em] text-slate-900 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-200/40 sm:mt-2 sm:px-5 sm:py-3.5 sm:text-lg sm:tracking-[0.4em]"
                      />
                    </div>
                  ) : null}
                </div>

                {/* Action buttons */}
                {!isPhoneVerified ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || verifyingOtp || isOtpSent || isPhoneVerified}
                      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-300/60 bg-[linear-gradient(135deg,rgba(183,223,105,0.55),rgba(183,223,105,0.35))] px-6 py-3 text-sm font-black text-emerald-800 shadow-[0_8px_20px_rgba(155,196,79,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {otpLoading ? <Loader2 size={17} className="animate-spin" /> : <Phone size={17} />}
                      Send Code
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || verifyingOtp || !isOtpSent || isPhoneVerified}
                      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-sky-500/70 bg-[linear-gradient(135deg,rgba(14,116,144,0.95),rgba(56,189,248,0.92))] px-6 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(14,116,144,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
                    >
                      {verifyingOtp ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle size={17} />}
                      Verify Code
                    </button>
                  </div>
                ) : null}

                {/* Status message */}
                {otpStatus.message ? (
                  <div className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    otpStatus.type === "success"
                      ? "border-emerald-200/60 bg-emerald-50/80 text-emerald-700"
                      : "border-red-200/60 bg-red-50/80 text-red-600"
                  }`}>
                    {otpStatus.type === "success"
                      ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
                      : <Shield size={16} className="mt-0.5 shrink-0" />}
                    {otpStatus.message}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="hidden">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                    <Phone size={20} className="text-green-600" /> Verify Your Account Number
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Number দিন, code পাঠান, তারপর OTP paste করে verify করুন।
                  </p>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${isPhoneVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  <CheckCircle size={14} />
                  {isPhoneVerified ? "Verified" : "Not Verified"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase text-gray-500">Phone Number</label>
                  <input
                    type="text"
                    placeholder="8801XXXXXXXXX"
                    value={verificationForm.whatsappNumber}
                    onChange={(e) => {
                      setVerificationForm((prev) => ({
                        ...prev,
                        whatsappNumber: e.target.value,
                      }));
                      if (otpStatus.message) {
                        setOtpStatus({ type: "", message: "" });
                      }
                    }}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3.5 outline-none transition focus:border-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase text-gray-500">OTP Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={verificationForm.code}
                    onChange={(e) => setVerificationForm((prev) => ({
                      ...prev,
                      code: e.target.value.replace(/\D/g, "").slice(0, 6),
                    }))}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3.5 outline-none transition focus:border-green-500"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || verifyingOtp}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  {otpLoading ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
                  Send Code
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || verifyingOtp}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {verifyingOtp ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Verify Code
                </button>
              </div>

              {otpStatus.message ? (
                <p className={`mt-4 text-sm font-medium ${otpStatus.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {otpStatus.message}
                </p>
              ) : null}
            </section>

            <div className="flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
              <div className="text-sm">
                {status.message ? (
                  <p className={`flex items-center gap-2 font-medium ${status.type === "success" ? "text-green-600" : "text-red-500"}`}>
                    {status.type === "success" ? <CheckCircle size={18} /> : null}
                    {status.message}
                  </p>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={loading || uploadingPhoto || uploadingCover}
                className="dashboard-accent-surface flex w-full items-center justify-center gap-3 rounded-2xl px-12 py-4 font-bold transition hover:-translate-y-1 active:scale-95 md:w-auto"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
