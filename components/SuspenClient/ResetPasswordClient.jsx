"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, MoveRight } from "lucide-react";

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
    <main className="relative min-h-screen overflow-hidden bg-[#000f08] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,44,22,0.38),transparent_42%),radial-gradient(circle_at_82%_14%,rgba(0,255,213,0.08),transparent_22%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(216,255,48,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,213,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1400px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:px-8">
        <section className="relative hidden min-h-[38vh] flex-1 overflow-hidden rounded-[2rem] border border-[#d8ff30]/8 bg-[linear-gradient(180deg,rgba(4,17,12,0.18),rgba(2,10,8,0.03))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.42)] sm:p-8 lg:flex lg:min-h-0 lg:rounded-[2.4rem] lg:p-10 xl:p-14">
          <div className="relative z-10 flex w-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-4">
                <Image src="/Neon Studio icon.png" alt="NeonCode logo" width={64} height={64} className="h-14 w-14 object-contain" priority />
                <p className="text-[2.1rem] font-black tracking-[0.26em] text-[#f5ffe6]"><span className="text-[#d8ff30]">NEON</span>CODE</p>
              </div>

              <p className="mt-10 text-xl tracking-[0.18em] text-[#f5ffe6]/88">SET. VERIFY. PROTECT.</p>
              <div className="mt-8 h-1.5 w-28 rounded-full bg-[linear-gradient(90deg,#d8ff30,rgba(216,255,48,0.1))] shadow-[0_0_20px_rgba(216,255,48,0.5)]" />

              <h1 className="mt-16 max-w-[620px] text-4xl font-black leading-[1.2] tracking-tight text-[#f6ffe9] sm:text-5xl xl:text-[4rem]">
                Choose A New
                <br />
                <span className="text-[#d8ff30]">Secure Password</span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-8 text-[#d6e5d6]/74">
                Set a fresh password for your NeonCode workspace and get back into your dashboard safely.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen w-full items-center justify-center lg:mt-0 lg:min-h-0 lg:w-[42%] lg:pl-6">
          <div className="relative w-full max-w-[620px] overflow-hidden rounded-[36px] border border-[#73839c]/45 bg-[linear-gradient(180deg,rgba(10,14,22,0.96),rgba(6,10,18,0.94))] p-5 shadow-[0_20px_90px_rgba(0,0,0,0.48),0_0_40px_rgba(0,255,213,0.08)] backdrop-blur-[24px] sm:p-7 lg:p-10">
            <div className="pointer-events-none absolute inset-[1px] rounded-[35px] border border-white/5" />

            <div className="relative z-10">
              <h2 className="text-4xl font-black tracking-tight text-[#f8ffec] sm:text-[3rem]">Reset Password</h2>
              <p className="mt-4 text-[1.02rem] leading-8 text-[#d3e5d9]/74">
                Create a password you&apos;ll use for your next login.
              </p>

              {error ? <div className="mt-6 rounded-[20px] border border-[#ff6d6d]/18 bg-[#ff4d4d]/8 px-4 py-3 text-sm text-[#ffd5d5]">{error}</div> : null}
              {success ? <div className="mt-6 rounded-[20px] border border-[#d8ff30]/18 bg-[#d8ff30]/8 px-4 py-3 text-sm text-[#efffd8]">{success}</div> : null}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="group relative flex min-h-[72px] w-full items-center justify-center overflow-hidden rounded-[20px] border border-[#d8ff30]/30 bg-[linear-gradient(90deg,#d1ff00_0%,#20d7ca_100%)] px-6 py-4 text-[1.85rem] font-black text-[#071006] shadow-[0_18px_40px_rgba(0,255,213,0.18),0_0_35px_rgba(216,255,48,0.22)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="relative z-10 inline-flex items-center gap-3">
                    {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : "Save Password"}
                    {!loading ? <MoveRight className="h-7 w-7" /> : null}
                  </span>
                </motion.button>
              </form>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-base text-[#d3e0d2]/72">
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
        </section>
      </div>
    </main>
  );
}

function ResetInput({ label, value, onChange, rightAction, type = "password", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-[#d2e4d3]/48">{label}</span>
      <div className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04] transition duration-300 focus-within:border-[#d8ff30]/35 focus-within:shadow-[0_0_0_1px_rgba(216,255,48,0.15),0_0_30px_rgba(0,255,213,0.12)]">
        <div className="relative flex items-center">
          <div className="pl-4 text-[#d8ff30]/86"><LockKeyhole className="h-5 w-5" /></div>
          <input
            type={type}
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-15 w-full bg-transparent px-4 py-4 text-[15px] text-[#f6ffea] outline-none placeholder:text-[#cad8ca]/36 sm:text-base"
          />
          {rightAction ? <div className="pr-4">{rightAction}</div> : null}
        </div>
      </div>
    </label>
  );
}
