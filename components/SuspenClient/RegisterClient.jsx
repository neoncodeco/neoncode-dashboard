"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { ArrowRight, Check, Eye, EyeOff, Loader2, LockKeyhole, Mail, MoveRight, Ticket, UserRound } from "lucide-react";

const REGISTER_STEPS = ["Create profile", "Set access", "Start workspace"];
const normalizeTextValue = (value) => (typeof value === "string" ? value : "");

export default function RegisterClient() {
  const { signup, googleLogin } = useFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRef = (searchParams.get("ref") || "").toUpperCase();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [referralCode, setReferralCode] = useState(initialRef);
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim()) {
      setError("Full name is required.");
      setLoading(false);
      return;
    }

    if (!agree) {
      setError("Please accept the terms to continue.");
      setLoading(false);
      return;
    }

    try {
      await signup(
        normalizeTextValue(email).trim(),
        normalizeTextValue(pass),
        normalizeTextValue(name).trim(),
        normalizeTextValue(referralCode).trim() || undefined
      );
      router.replace("/");
    } catch (err) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await googleLogin();
    } catch {
      setError("Google signup failed");
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
                BUILD. CREATE. LAUNCH.
              </p>
              <div className="mt-5 h-1.5 w-24 rounded-full bg-[linear-gradient(90deg,#d8ff30,rgba(216,255,48,0.1))] shadow-[0_0_20px_rgba(216,255,48,0.5)]" />

              <h1 className="mt-10 text-3xl font-black leading-tight text-[#f6ffe9] sm:text-4xl xl:text-[2.9rem]">
                Launch Your
                <br />
                <span className="text-[#d8ff30]">NeonCode Workspace</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-[#d6e5d6]/74 sm:text-lg">
                Create your account and access the full dashboard, services, and workspace tools.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {REGISTER_STEPS.map((step) => (
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
              <h2 className="text-3xl font-black tracking-tight text-[#f8ffec] sm:text-[2.35rem]">Create Account</h2>
              <p className="mt-3 text-sm leading-7 text-[#d3e5d9]/74 sm:text-base">
                Fill the form below to create your account.
              </p>

              {error ? <div className="mt-5 rounded-[16px] border border-[#ff6d6d]/18 bg-[#ff4d4d]/8 px-4 py-3 text-sm text-[#ffd5d5]">{error}</div> : null}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
                <AuthInput
                  label="Full Name"
                  icon={UserRound}
                  value={normalizeTextValue(name)}
                  onChange={setName}
                  placeholder="John Doe"
                />

                <AuthInput
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={normalizeTextValue(email)}
                  onChange={setEmail}
                  placeholder="name@neoncode.co"
                />

                <AuthInput
                  label="Password"
                  icon={LockKeyhole}
                  type={showPass ? "text" : "password"}
                  value={normalizeTextValue(pass)}
                  onChange={setPass}
                  placeholder="Choose a secure password"
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowPass((current) => !current)}
                      className="rounded-full p-1 text-[#d6ead6]/66 transition hover:text-[#f3ffe4]"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />

                <AuthInput
                  label="Referral Code"
                  icon={Ticket}
                  value={normalizeTextValue(referralCode)}
                  onChange={(value) => setReferralCode(value.toUpperCase())}
                  placeholder="Optional referral code"
                />

                <label className="inline-flex cursor-pointer items-start gap-3 text-sm text-[#d7e4d7]/72">
                  <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d8ff30]/35 bg-[#d8ff30]/8">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="peer absolute inset-0 cursor-pointer opacity-0"
                    />
                    <Check className="pointer-events-none absolute h-3.5 w-3.5 scale-0 text-[#d8ff30] transition peer-checked:scale-100" />
                  </span>
                  <span>I agree to the terms and want to create my NeonCode workspace.</span>
                </label>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="group relative flex min-h-[62px] w-full items-center justify-center overflow-hidden rounded-[16px] border border-[#d8ff30]/30 bg-[linear-gradient(90deg,#d1ff00_0%,#20d7ca_100%)] px-6 py-3 text-xl font-black text-[#071006] shadow-[0_18px_40px_rgba(0,255,213,0.18),0_0_35px_rgba(216,255,48,0.22)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[66px] sm:text-2xl"
                >
                  <span className="relative z-10 inline-flex items-center gap-3">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Get Started"}
                    {!loading ? <MoveRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" /> : null}
                  </span>
                </motion.button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-[#d3e0d2]/60 sm:my-6">
                <div className="h-px flex-1 bg-white/10" />
                <span>OR CONTINUE WITH</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-[#f2ffe4] transition hover:border-[#00ffd5]/25 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FcGoogle size={18} />}
                Sign up with Google
              </button>

              <div className="mt-7 flex flex-wrap items-center gap-2 text-sm text-[#d3e0d2]/72 sm:text-base">
                <span>Already have an account?</span>
                <Link href="/login" className="group relative inline-flex items-center gap-2 font-semibold text-[#f4ffe6]">
                  <span className="relative">
                    Login here
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

function AuthInput({ label, value, onChange, rightAction, icon: Icon, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d2e4d3]/48 sm:text-xs">{label}</span>
      <div className="group relative overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.04] transition duration-300 focus-within:border-[#d8ff30]/35 focus-within:shadow-[0_0_0_1px_rgba(216,255,48,0.15),0_0_30px_rgba(0,255,213,0.12)]">
        <div className="relative flex items-center">
          {Icon ? (
            <div className="pl-4 text-[#d8ff30]/86">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <input
            type={type}
            required={label !== "Referral Code"}
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
