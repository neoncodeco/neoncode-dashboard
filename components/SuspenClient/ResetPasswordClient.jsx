"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, MoveRight } from "lucide-react";

const RESET_STEPS = ["Verify token", "Set password", "Login again"];

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = String(searchParams.get("token") || "");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token missing. Please request a new reset link.");
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
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Password reset failed");

      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => router.replace("/login"), 1400);
    } catch (err) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

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
                <Image src="/Neon Studio icon.png" alt="NeonCode logo" width={64} height={64} className="h-14 w-14 object-contain" priority />
                <p className="text-[1.75rem] font-black tracking-[0.22em] text-[#f5ffe6] sm:text-[2rem]">
                  <span className="text-[#d8ff30]">NEON</span>CODE
                </p>
              </div>

              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-[#f5ffe6]/78 sm:text-base">
                SET. VERIFY. PROTECT.
              </p>
              <div className="mt-5 h-1.5 w-24 rounded-full bg-[linear-gradient(90deg,#d8ff30,rgba(216,255,48,0.1))] shadow-[0_0_20px_rgba(216,255,48,0.5)]" />

              <h1 className="mt-10 text-3xl font-black leading-tight text-[#f6ffe9] sm:text-4xl xl:text-[2.9rem]">
                Choose A New
                <br />
                <span className="text-[#d8ff30]">Secure Password</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-[#d6e5d6]/74 sm:text-lg">
                Set a fresh password for your NeonCode workspace and get back into your dashboard safely.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {RESET_STEPS.map((step) => (
                  <span
                    key={step}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d8ff30]/20 bg-[#d8ff30]/5 px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#eaf7dc]/90 sm:text-[0.72rem]"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#d8ff30]" />
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,213,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(216,255,48,0.12),transparent_26%)]" />

            <div className="relative z-10">
              <h2 className="text-3xl font-black tracking-tight text-[#f8ffec] sm:text-[2.35rem]">Reset Password</h2>
              <p className="mt-3 text-sm leading-7 text-[#d3e5d9]/74 sm:text-base">
                Create a password you&apos;ll use for your next login.
              </p>

              {error ? <div className="mt-5 rounded-[16px] border border-[#ff6d6d]/18 bg-[#ff4d4d]/8 px-4 py-3 text-sm text-[#ffd5d5]">{error}</div> : null}
              {success ? <div className="mt-5 rounded-[16px] border border-[#d8ff30]/18 bg-[#d8ff30]/8 px-4 py-3 text-sm text-[#efffd8]">{success}</div> : null}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
                <ResetInput
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter new password"
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="rounded-full p-1 text-[#d6ead6]/66 transition hover:text-[#f3ffe4]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />

                <ResetInput
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Retype new password"
                />

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="group relative flex min-h-[62px] w-full items-center justify-center overflow-hidden rounded-[16px] border border-[#d8ff30]/30 bg-[linear-gradient(90deg,#d1ff00_0%,#20d7ca_100%)] px-6 py-3 text-xl font-black text-[#071006] shadow-[0_18px_40px_rgba(0,255,213,0.18),0_0_35px_rgba(216,255,48,0.22)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[66px] sm:text-2xl"
                >
                  <span className="relative z-10 inline-flex items-center gap-3">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Save Password"}
                    {!loading ? <MoveRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" /> : null}
                  </span>
                </motion.button>
              </form>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[#d3e0d2]/72">
                Use at least one uppercase letter, one number, and one symbol for stronger protection.
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2 text-sm text-[#d3e0d2]/72 sm:text-base">
                <span>Need a new reset link?</span>
                <Link href="/forgot-password" className="group relative inline-flex items-center gap-2 font-semibold text-[#f4ffe6]">
                  <span className="relative">
                    Request again
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

function ResetInput({ label, value, onChange, rightAction, type = "password", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d2e4d3]/48 sm:text-xs">{label}</span>
      <div className="group relative overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.04] transition duration-300 focus-within:border-[#d8ff30]/35 focus-within:shadow-[0_0_0_1px_rgba(216,255,48,0.15),0_0_30px_rgba(0,255,213,0.12)]">
        <div className="relative flex items-center">
          <div className="pl-4 text-[#d8ff30]/86"><LockKeyhole className="h-5 w-5" /></div>
          <input
            type={type}
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-14 w-full bg-transparent px-4 py-3 text-[15px] text-[#f6ffea] outline-none placeholder:text-[#cad8ca]/36 sm:text-base"
          />
          {rightAction ? <div className="pr-4">{rightAction}</div> : null}
        </div>
      </div>
    </label>
  );
}
