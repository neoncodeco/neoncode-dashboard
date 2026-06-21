"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Mail, MoveRight } from "lucide-react";
import AuthTurnstile from "@/components/AuthTurnstile";
import AuthPasswordFields from "@/components/auth/AuthPasswordFields";

const INFO_STEPS = ["Enter email", "Verify code", "Set password"];
const OTP_RESEND_COOLDOWN_SEC = 60;

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (turnstileSiteKey && !turnstileToken) {
      setError("Please complete the security check.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed");

      setStep("otp");
      setOtpCode("");
      setResendCooldown(OTP_RESEND_COOLDOWN_SEC);
      setNotice(json?.message || "Reset code sent to your email.");
    } catch (err) {
      setTurnstileToken("");
      turnstileRef.current?.reset();
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    const normalizedCode = String(otpCode || "").replace(/\D/g, "");
    if (normalizedCode.length !== 6) {
      setError("Enter the 6-digit reset code from your email.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: normalizedCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Verification failed");

      setResetToken(json.resetToken || "");
      setStep("password");
      setPassword("");
      setConfirmPassword("");
      setNotice(json?.message || "Code verified. Set your new password.");
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/auth/forgot-password/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Resend failed");

      setResendCooldown(OTP_RESEND_COOLDOWN_SEC);
      setNotice(json?.message || "A new reset code has been sent.");
    } catch (err) {
      setError(err.message || "Could not resend reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!resetToken) {
      setError("Reset session expired. Please start again.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetToken, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Password reset failed");

      setNotice("Password reset successful. Redirecting to login...");
      setTimeout(() => router.replace("/login?password_reset=1"), 1400);
    } catch (err) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const stepTitle =
    step === "email" ? "Forgot Password" : step === "otp" ? "Verify Reset Code" : "Create New Password";

  const stepDescription =
    step === "email"
      ? "Enter your account email and we will send a verification code."
      : step === "otp"
        ? `Enter the 6-digit code sent to ${email || "your email"}.`
        : "Choose a strong password for your next login.";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#000f08] px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,44,22,0.38),transparent_42%),radial-gradient(circle_at_82%_14%,rgba(0,255,213,0.08),transparent_22%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(216,255,48,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,213,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1100px] items-center justify-center">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="grid w-full overflow-hidden rounded-[30px] border border-[#73839c]/45 bg-[linear-gradient(180deg,rgba(10,14,22,0.96),rgba(6,10,18,0.94))] shadow-[0_20px_90px_rgba(0,0,0,0.48),0_0_40px_rgba(0,255,213,0.08)] lg:min-h-[680px] lg:grid-cols-2"
        >
          <div className="relative border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:border-r-white/10 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(216,255,48,0.08),transparent_24%),radial-gradient(circle_at_80%_24%,rgba(0,255,213,0.08),transparent_24%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-4">
                <Image src="/Neon-Studio-icon.png" alt="NeonCode logo" width={64} height={64} className="h-14 w-14 object-contain" priority />
                <p className="text-[1.75rem] font-black tracking-[0.22em] text-[#f5ffe6] sm:text-[2rem]">
                  <span className="text-[#d8ff30]">NEON</span>CODE
                </p>
              </div>

              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-[#f5ffe6]/78 sm:text-base">
                SECURE. RESET. ACCESS.
              </p>
              <div className="mt-5 h-1.5 w-24 rounded-full bg-[linear-gradient(90deg,#d8ff30,rgba(216,255,48,0.1))] shadow-[0_0_20px_rgba(216,255,48,0.5)]" />

              <h1 className="mt-10 text-3xl font-black leading-tight text-[#f6ffe9] sm:text-4xl xl:text-[2.9rem]">
                Reset Your
                <br />
                <span className="text-[#d8ff30]">Workspace Access</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-[#d6e5d6]/74 sm:text-lg">
                Verify your email with a one-time code, then set a new password securely.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {INFO_STEPS.map((item, index) => {
                  const active =
                    (step === "email" && index === 0) ||
                    (step === "otp" && index === 1) ||
                    (step === "password" && index === 2);
                  const done =
                    (step === "otp" && index === 0) ||
                    (step === "password" && index <= 1);

                  return (
                    <span
                      key={item}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] sm:text-[0.72rem] ${
                        active
                          ? "border-[#d8ff30]/35 bg-[#d8ff30]/10 text-[#f3ffe4]"
                          : done
                            ? "border-[#9ddb52]/25 bg-[#9ddb52]/8 text-[#e6ffd2]"
                            : "border-[#d8ff30]/20 bg-[#d8ff30]/5 text-[#eaf7dc]/90"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          active || done ? "bg-[#d8ff30]" : "bg-[#d8ff30]/50"
                        }`}
                      />
                      {item}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,213,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(216,255,48,0.12),transparent_26%)]" />

            <div className="relative z-10">
              <h2 className="text-3xl font-black tracking-tight text-[#f8ffec] sm:text-[2.35rem]">{stepTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-[#d3e5d9]/74 sm:text-base">{stepDescription}</p>

              {notice ? (
                <div className="mt-5 rounded-[16px] border border-[#9ddb52]/28 bg-[#9ddb52]/10 px-4 py-3 text-sm text-[#e6ffd2]">
                  {notice}
                </div>
              ) : null}
              {error ? (
                <div className="mt-5 rounded-[16px] border border-[#ff6d6d]/18 bg-[#ff4d4d]/8 px-4 py-3 text-sm text-[#ffd5d5]">
                  {error}
                </div>
              ) : null}

              {step === "email" ? (
                <form onSubmit={handleSendOtp} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d2e4d3]/48 sm:text-xs">
                      Email Address
                    </span>
                    <div className="group relative overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.04] transition duration-300 focus-within:border-[#d8ff30]/35 focus-within:shadow-[0_0_0_1px_rgba(216,255,48,0.15),0_0_30px_rgba(0,255,213,0.12)]">
                      <div className="relative flex items-center">
                        <div className="pl-4 text-[#d8ff30]/86">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@neoncode.co"
                          className="h-14 w-full bg-transparent px-4 py-3 text-[15px] text-[#f6ffea] outline-none placeholder:text-[#cad8ca]/36 sm:text-base"
                        />
                      </div>
                    </div>
                  </label>

                  <AuthTurnstile
                    ref={turnstileRef}
                    action="forgot-password"
                    className="flex justify-center pt-1"
                    onTokenChange={setTurnstileToken}
                  />

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="group relative flex min-h-[62px] w-full items-center justify-center overflow-hidden rounded-[16px] border border-[#d8ff30]/30 bg-[linear-gradient(90deg,#d1ff00_0%,#20d7ca_100%)] px-6 py-3 text-xl font-black text-[#071006] shadow-[0_18px_40px_rgba(0,255,213,0.18),0_0_35px_rgba(216,255,48,0.22)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[66px] sm:text-2xl"
                  >
                    <span className="relative z-10 inline-flex items-center gap-3">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Send Reset Code"}
                      {!loading ? <MoveRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" /> : null}
                    </span>
                  </motion.button>
                </form>
              ) : null}

              {step === "otp" ? (
                <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d2e4d3]/48 sm:text-xs">
                      Reset Code
                    </span>
                    <div className="group relative overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.04] transition duration-300 focus-within:border-[#d8ff30]/35 focus-within:shadow-[0_0_0_1px_rgba(216,255,48,0.15),0_0_30px_rgba(0,255,213,0.12)]">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="h-14 w-full bg-transparent px-4 py-3 text-center text-2xl font-bold tracking-[0.45em] text-[#f6ffea] outline-none placeholder:text-[#cad8ca]/36"
                      />
                    </div>
                  </label>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="group relative flex min-h-[62px] w-full items-center justify-center overflow-hidden rounded-[16px] border border-[#d8ff30]/30 bg-[linear-gradient(90deg,#d1ff00_0%,#20d7ca_100%)] px-6 py-3 text-xl font-black text-[#071006] shadow-[0_18px_40px_rgba(0,255,213,0.18),0_0_35px_rgba(216,255,48,0.22)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[66px] sm:text-2xl"
                  >
                    <span className="relative z-10 inline-flex items-center gap-3">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Verify Code"}
                      {!loading ? <MoveRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" /> : null}
                    </span>
                  </motion.button>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#d3e0d2]/72">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setError("");
                        setNotice("");
                        setOtpCode("");
                      }}
                      className="font-semibold text-[#f4ffe6] underline underline-offset-4 hover:text-[#d8ff30]"
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading || resendCooldown > 0}
                      className="font-semibold text-[#d8ff30] underline underline-offset-4 hover:text-[#ebffd2] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                  </div>
                </form>
              ) : null}

              {step === "password" ? (
                <form onSubmit={handleResetPassword} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
                  <AuthPasswordFields
                    password={password}
                    confirmPassword={confirmPassword}
                    onPasswordChange={setPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                    showPassword={showPassword}
                    onToggleShowPassword={() => setShowPassword((current) => !current)}
                    passwordLabel="New Password"
                    confirmLabel="Confirm New Password"
                    passwordPlaceholder="Enter new password"
                    confirmPlaceholder="Re-enter new password"
                  />

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="group relative flex min-h-[62px] w-full items-center justify-center overflow-hidden rounded-[16px] border border-[#d8ff30]/30 bg-[linear-gradient(90deg,#d1ff00_0%,#20d7ca_100%)] px-6 py-3 text-xl font-black text-[#071006] shadow-[0_18px_40px_rgba(0,255,213,0.18),0_0_35px_rgba(216,255,48,0.22)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[66px] sm:text-2xl"
                  >
                    <span className="relative z-10 inline-flex items-center gap-3">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Save New Password"}
                      {!loading ? <MoveRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" /> : null}
                    </span>
                  </motion.button>
                </form>
              ) : null}

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3e0d2]/72">
                Reset codes expire in 10 minutes. After verification, you have 15 minutes to set a new password.
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2 text-sm text-[#d3e0d2]/72 sm:text-base">
                <span>Remembered your password?</span>
                <Link href="/login" className="group relative inline-flex items-center gap-2 font-semibold text-[#f4ffe6]">
                  <span className="relative">
                    Back to login
                    <span className="absolute bottom-[-5px] left-0 h-[2px] w-0 bg-[#d8ff30] transition-all duration-300 group-hover:w-full" />
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
