"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  LockKeyhole,
  Mail,
  MoveRight,
  Ticket,
  UserRound,
} from "lucide-react";

const REGISTER_PILLS = ["CREATE", "LAUNCH", "GROW", "SCALE"];
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
    <main className="relative min-h-screen overflow-hidden bg-[#000f08] text-white">
      <RegisterBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:px-8">
        {/* <TopControls /> */}
        <motion.section
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative hidden min-h-[42vh] flex-1 overflow-hidden rounded-[2rem] border border-[#d8ff30]/8 bg-[linear-gradient(180deg,rgba(4,17,12,0.2),rgba(2,10,8,0.02))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.42)] sm:p-8 lg:flex lg:min-h-0 lg:rounded-[2.4rem] lg:p-10 xl:p-14"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(216,255,48,0.08),transparent_22%),radial-gradient(circle_at_75%_28%,rgba(0,255,213,0.08),transparent_22%)]" />

          <div className="relative z-10 flex w-full flex-col justify-between">
            <div>
              <BrandLogo />

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7 }}
                className="mt-10 text-xl tracking-[0.18em] text-[#f5ffe6]/88"
              >
                BUILD. CREATE. LAUNCH. <span className="text-[#d8ff30]">BRIGHTER.</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scaleX: 0.7 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.22, duration: 0.7 }}
                className="mt-8 h-1.5 w-28 origin-left rounded-full bg-[linear-gradient(90deg,#d8ff30,rgba(216,255,48,0.1))] shadow-[0_0_20px_rgba(216,255,48,0.5)]"
              />
              <div className="mt-1 flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff30]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff30]" />
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.8 }}
                className="mt-20 max-w-[650px] text-4xl font-black leading-[1.2] tracking-tight text-[#f6ffe9] sm:text-5xl xl:text-[4.25rem]"
              >
                Launch Your
                <br />
                <span className="text-[#d8ff30]">NeonCode</span>
                <br />
                Creative
                <br />
                Workspace.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.75 }}
                className="mt-8 max-w-xl text-xl leading-8 text-[#d6e5d6]/74"
              >
                Create your account, unlock your premium dashboard, and start building from the same modern system.
              </motion.p>

              <div className="mt-6 h-1.5 w-12 rounded-full bg-[#d8ff30] shadow-[0_0_18px_rgba(216,255,48,0.55)]" />

              <div className="mt-10 flex flex-wrap gap-8 lg:gap-12">
                {REGISTER_PILLS.map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42 + index * 0.08, duration: 0.55 }}
                    className="inline-flex items-center gap-4 text-base uppercase tracking-[0.18em] text-[#eaf7dc]/88"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8ff30]/30 bg-[rgba(216,255,48,0.04)] shadow-[0_0_20px_rgba(216,255,48,0.12)] text-[#d8ff30]">
                      <span className="h-4 w-4 rounded-[4px] border border-current" />
                    </span>
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>

            <RegisterHeroVisual />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, ease: "easeOut", delay: 0.08 }}
          className="relative flex min-h-screen w-full items-center justify-center lg:mt-0 lg:min-h-0 lg:w-[44%] lg:pl-6 xl:w-[40%]"
        >
          <div className="absolute inset-y-12 -right-5 hidden w-full rounded-[34px] border border-[#00ffd5]/20 bg-[linear-gradient(180deg,rgba(6,14,22,0.4),rgba(6,14,22,0.18))] shadow-[0_0_40px_rgba(0,255,213,0.12)] lg:block" />

          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-full max-w-[640px] overflow-hidden rounded-[36px] border border-[#73839c]/45 bg-[linear-gradient(180deg,rgba(10,14,22,0.96),rgba(6,10,18,0.94))] p-5 shadow-[0_20px_90px_rgba(0,0,0,0.48),0_0_40px_rgba(0,255,213,0.08)] backdrop-blur-[24px] sm:p-7 lg:p-10"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,213,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(216,255,48,0.12),transparent_26%)]" />
            <div className="pointer-events-none absolute inset-[1px] rounded-[35px] border border-white/5" />

            <div className="relative z-10">
              <h2 className="text-4xl font-black tracking-tight text-[#f8ffec] sm:text-[3.25rem]">Create Account</h2>
              <p className="mt-4 max-w-md text-[1.08rem] leading-8 text-[#d3e5d9]/74">
                Step into your creative operating system and set up your NeonCode account.
              </p>

              <div className="mt-10 flex items-center gap-10 border-b border-white/8 pb-4 text-xl">
                <button type="button" className="relative font-bold text-white">
                  Registration
                  <span className="absolute -bottom-4 left-0 h-1 w-36 rounded-full bg-[#d8ff30] shadow-[0_0_18px_rgba(216,255,48,0.65)]" />
                </button>
              </div>

              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-[20px] border border-[#ff6d6d]/18 bg-[#ff4d4d]/8 px-4 py-3 text-sm text-[#ffd5d5]"
                >
                  {error}
                </motion.div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <RegisterInput
                  label="Full Name"
                  icon={UserRound}
                  value={normalizeTextValue(name)}
                  onChange={setName}
                  placeholder="John Doe"
                />

                <RegisterInput
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={normalizeTextValue(email)}
                  onChange={setEmail}
                  placeholder="john@neoncode.co"
                />

                <RegisterInput
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

                <RegisterInput
                  label="Referral Code"
                  icon={Ticket}
                  value={normalizeTextValue(referralCode)}
                  onChange={(value) => setReferralCode(value.toUpperCase())}
                  placeholder="Optional referral code"
                />

                <div className="flex items-start gap-3 text-sm text-[#d4e3d5]">
                  <label className="inline-flex cursor-pointer items-start gap-3">
                    <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d8ff30]/35 bg-[#d8ff30]/8 shadow-[0_0_20px_rgba(216,255,48,0.08)]">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="peer absolute inset-0 cursor-pointer opacity-0"
                      />
                      <span className="absolute inset-0 rounded-full border border-transparent transition peer-focus:ring-4 peer-focus:ring-[#00ffd5]/10" />
                      <Check className="pointer-events-none absolute h-4 w-4 scale-0 text-[#d8ff30] transition peer-checked:scale-100" />
                    </span>
                    <span className="leading-7 text-[#d7e4d7]/72">
                      I agree to the terms and want to create my NeonCode workspace.
                    </span>
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="group relative flex min-h-[72px] w-full items-center justify-center overflow-hidden rounded-[20px] border border-[#d8ff30]/30 bg-[linear-gradient(90deg,#d1ff00_0%,#20d7ca_100%)] px-6 py-4 text-[1.95rem] font-black text-[#071006] shadow-[0_18px_40px_rgba(0,255,213,0.18),0_0_35px_rgba(216,255,48,0.22)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28),transparent_58%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                  <span className="relative z-10 inline-flex items-center gap-3">
                    {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : "Get Started"}
                    {!loading ? <MoveRight className="h-7 w-7 transition-transform duration-300 group-hover:translate-x-1" /> : null}
                  </span>
                </motion.button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-white/4" />
                  <span className="text-[1.02rem] text-[#d0e4d5]/75">Or continue with</span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/4 via-white/12 to-transparent" />
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[#f2ffe4] transition duration-300 hover:border-[#00ffd5]/25 hover:bg-white/[0.07] hover:shadow-[0_0_30px_rgba(0,255,213,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FcGoogle size={22} />}
                <span>Sign up with Google</span>
              </button>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-base text-[#d3e0d2]/72">
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
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}

function BrandLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="inline-flex items-center gap-4"
    >
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-[0_0_40px_rgba(216,255,48,0.15)]">
        <Image
          src="/Neon Studio icon.png"
          alt="NeonCode logo"
          width={64}
          height={64}
          className="h-14 w-14 object-contain"
          priority
        />
      </div>
      <div>
        <p className="text-[2.1rem] font-black tracking-[0.26em] text-[#f5ffe6]">
          <span className="text-[#d8ff30]">NEON</span>CODE
        </p>
      </div>
    </motion.div>
  );
}

// function TopControls() {
//   return (
//     <div className="absolute right-4 top-4 z-20 hidden items-center gap-4 lg:flex lg:right-8 lg:top-5">
//       <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(10,16,24,0.84)] px-5 py-3 text-lg text-white/90 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
//         <Globe className="h-5 w-5" />
//         <span className="font-medium">EN</span>
//         <ChevronDown className="h-4 w-4" />
//       </div>
//       <div className="inline-flex items-center gap-4 rounded-full border border-[#d8ff30]/25 bg-[rgba(10,16,24,0.84)] px-5 py-3 text-white shadow-[0_0_35px_rgba(216,255,48,0.08)]">
//         <span className="flex h-5 w-5 items-center justify-center text-white/80">
//           <span className="h-3.5 w-3.5 rounded-[4px] border border-current" />
//         </span>
//         <span className="h-6 w-6 rounded-full bg-[#d8ff30] shadow-[0_0_18px_rgba(216,255,48,0.7)]" />
//       </div>
//     </div>
//   );
// }

function RegisterBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-45"
        animate={{ backgroundPosition: ["0px 0px", "0px 120px"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "linear-gradient(rgba(216,255,48,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,213,0.045) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(circle at center, black 38%, transparent 100%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,44,22,0.4),transparent_42%),radial-gradient(circle_at_82%_14%,rgba(0,255,213,0.08),transparent_22%)]" />
      <div className="absolute left-[9%] top-[18%] h-56 w-56 rounded-full bg-[#d8ff30]/10 blur-3xl" />
      <div className="absolute bottom-[12%] right-[10%] h-64 w-64 rounded-full bg-[#00ffd5]/8 blur-3xl" />
    </div>
  );
}

function RegisterHeroVisual() {
  return (
    <div className="relative mt-10 hidden min-h-[380px] lg:block">
      <div className="absolute inset-x-[8%] bottom-4 h-40 rounded-[32px] border border-[#19321f] bg-[linear-gradient(180deg,rgba(8,16,13,0.14),rgba(8,16,13,0.58))]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(216,255,48,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,213,0.05)_1px,transparent_1px)] bg-[length:18px_18px] opacity-60" />
      </div>
      <div className="absolute left-[15%] top-[19rem] h-px w-36 rotate-[-24deg] bg-white/12" />
      <div className="absolute left-[10%] top-[22rem] h-px w-44 rotate-[-24deg] bg-white/12" />
      <motion.div
        animate={{ rotate: [14, 8, 14], x: [0, 10, 0], y: [0, -8, 0] }}
        transition={{ duration: 10.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[22%] top-[7rem] h-[16rem] w-[16rem] rounded-[40%] border border-[#8ff94d]/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(216,255,48,0.45),rgba(0,255,213,0.14)_66%,rgba(0,0,0,0.02))] shadow-[inset_0_0_60px_rgba(255,255,255,0.1),0_0_90px_rgba(153,255,64,0.12)]"
      />
      <motion.div
        animate={{ rotate: [-12, -20, -12], x: [0, -6, 0], y: [0, 8, 0] }}
        transition={{ duration: 10.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[35%] top-[8rem] h-[15rem] w-[6.8rem] rounded-[999px] border border-[#f6ff9d]/22 bg-[linear-gradient(180deg,rgba(252,255,226,0.34),rgba(216,255,48,0.94)_44%,rgba(36,255,210,0.08)_88%)] shadow-[0_0_60px_rgba(216,255,48,0.24)]"
      />
      <motion.div
        animate={{ rotate: [-22, -14, -22], x: [0, -10, 0], y: [0, 8, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[48%] top-[10rem] h-[12rem] w-[12rem] rounded-[42%] border border-[#00ffd5]/16 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),rgba(0,255,213,0.16),rgba(7,17,6,0.02))] shadow-[0_0_60px_rgba(0,255,213,0.12)]"
      />
      <motion.div
        animate={{ x: [0, 10, 0], y: [0, -8, 0] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[13%] top-[20rem] h-8 w-8 rounded-full bg-[radial-gradient(circle,rgba(216,255,48,0.95),rgba(216,255,48,0.2)_45%,transparent_72%)] shadow-[0_0_20px_rgba(216,255,48,0.5)]"
      />
      <motion.div
        animate={{ x: [0, -8, 0], y: [0, 5, 0] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[22%] top-[17rem] h-12 w-12 rounded-full bg-[radial-gradient(circle,rgba(216,255,48,0.9),rgba(216,255,48,0.2)_40%,transparent_72%)] shadow-[0_0_24px_rgba(216,255,48,0.5)]"
      />
    </div>
  );
}

function RegisterInput({ label, icon: Icon, value, onChange, rightAction, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-[#d2e4d3]/48">{label}</span>
      <div className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04] transition duration-300 focus-within:border-[#d8ff30]/35 focus-within:shadow-[0_0_0_1px_rgba(216,255,48,0.15),0_0_30px_rgba(0,255,213,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_38%)] opacity-60" />
        <div className="relative flex items-center">
          <div className="pl-4 text-[#d8ff30]/86">
            <Icon className="h-5 w-5" />
          </div>
          <input
            type={type}
            required={label !== "Referral Code"}
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
