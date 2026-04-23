"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { ArrowRight, Eye, EyeOff, Github, Loader2, LockKeyhole, Mail, MoveRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import AuthTurnstile from "@/components/AuthTurnstile";
import useFingerprint from "@/hooks/useFingerprint";

const LOGIN_STEPS = ["Enter credentials", "Verify access", "Open dashboard"];
const normalizeTextValue = (value) => (typeof value === "string" ? value : "");

export default function LoginPageContent() {
  const { login, googleLogin } = useFirebaseAuth();
  const { getFingerprint, loadingFingerprint } = useFingerprint();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState("");
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef(null);

  const verifyEmailSent = searchParams.get("verify_email_sent") === "1";
  const emailVerified = searchParams.get("email_verified");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedEmail = window.localStorage.getItem("neoncode_login_email");
    if (savedEmail && savedEmail !== "[object Object]") {
      setEmail(savedEmail);
      setRemember(true);
    } else if (savedEmail === "[object Object]") {
      window.localStorage.removeItem("neoncode_login_email");
    }
  }, []);

  useEffect(() => {
    if (verifyEmailSent) {
      setNotice("Verification email sent. Check your inbox. Link expires in 5 minutes.");
      return;
    }
    if (emailVerified === "1") {
      setNotice("Email verified successfully. You can now sign in.");
      return;
    }
    if (emailVerified === "0") {
      setError("Verification link is invalid or expired. Please request a new one.");
    }
  }, [emailVerified, verifyEmailSent]);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const normalizedEmail = normalizeTextValue(email).trim();
      const normalizedPass = normalizeTextValue(pass);

      if (turnstileSiteKey && !turnstileToken) {
        setError("Please complete the security check.");
        setLoading(false);
        return;
      }

      const deviceFingerprint = await getFingerprint();
      await login(normalizedEmail, normalizedPass, turnstileToken, deviceFingerprint);

      if (remember && typeof window !== "undefined") {
        window.localStorage.setItem("neoncode_login_email", normalizedEmail);
      } else if (typeof window !== "undefined") {
        window.localStorage.removeItem("neoncode_login_email");
      }

      router.replace("/");
    } catch {
      setTurnstileToken("");
      turnstileRef.current?.reset();
      setError("Email or password matched hoyni. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const normalizedEmail = normalizeTextValue(email).trim();
    if (!normalizedEmail) {
      setError("Email field e email din, then resend click korun.");
      return;
    }

    setResendLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/auth/email-verification/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Resend failed");
      }
      setNotice(json?.message || "Verification email sent.");
    } catch (e) {
      setError(e?.message || "Could not resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setProviderLoading("google");
    setError("");

    try {
      await googleLogin();
    } catch {
      setError("Google sign-in complete korte parini. Please try again.");
      setProviderLoading("");
    }
  };

  const handleGithubLogin = async () => {
    setProviderLoading("github");
    setError("");

    try {
      const res = await signIn("github", {
        redirect: false,
        callbackUrl: "/",
      });

      if (res?.error) throw new Error(res.error);
      if (res?.url) {
        window.location.href = res.url;
        return;
      }

      throw new Error("GitHub login unavailable");
    } catch {
      setError("GitHub sign-in ekhono configure kora nei. Google ba email diye login korun.");
      setProviderLoading("");
    }
  };

  const providerBusy = providerLoading === "google" || providerLoading === "github";

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
          <div className="relative hidden border-b border-white/10 p-6 sm:p-8 lg:block lg:border-b-0 lg:border-r lg:border-r-white/10 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(216,255,48,0.08),transparent_24%),radial-gradient(circle_at_80%_24%,rgba(0,255,213,0.08),transparent_24%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-4">
                <Image src="/Neon Studio icon.png" alt="NeonCode logo" width={64} height={64} className="h-14 w-14 object-contain" priority />
                <p className="text-[1.75rem] font-black tracking-[0.22em] text-[#f5ffe6] sm:text-[2rem]">
                  <span className="text-[#d8ff30]">NEON</span>CODE
                </p>
              </div>

              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-[#f5ffe6]/78 sm:text-base">
                BUILD. ACCESS. CONTINUE.
              </p>
              <div className="mt-5 h-1.5 w-24 rounded-full bg-[linear-gradient(90deg,#d8ff30,rgba(216,255,48,0.1))] shadow-[0_0_20px_rgba(216,255,48,0.5)]" />

              <h1 className="mt-10 text-3xl font-black leading-tight text-[#f6ffe9] sm:text-4xl xl:text-[2.9rem]">
                Welcome Back
                <br />
                <span className="text-[#d8ff30]">Sign In Securely</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-[#d6e5d6]/74 sm:text-lg">
                Login to your NeonCode workspace and continue your tasks, projects, and team updates.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {LOGIN_STEPS.map((step) => (
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
              <h2 className="text-3xl font-black tracking-tight text-[#f8ffec] sm:text-[2.35rem]">Sign In</h2>
              <p className="mt-3 text-sm leading-7 text-[#d3e5d9]/74 sm:text-base">
                Enter your account details to continue.
              </p>

              {notice ? (
                <div className="mt-5 rounded-[16px] border border-[#9ddb52]/28 bg-[#9ddb52]/10 px-4 py-3 text-sm text-[#e6ffd2]">
                  <p>{notice}</p>
                  {(verifyEmailSent || emailVerified === "0") && !resendLoading ? (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="mt-2 text-xs font-semibold text-[#d8ff30] underline underline-offset-4 hover:text-[#ebffd2]"
                    >
                      Need a new verification email?
                    </button>
                  ) : null}
                  {(verifyEmailSent || emailVerified === "0") && resendLoading ? (
                    <p className="mt-2 text-xs text-[#ecffd4]/85">Sending verification...</p>
                  ) : null}
                </div>
              ) : null}
              {error ? <div className="mt-5 rounded-[16px] border border-[#ff6d6d]/18 bg-[#ff4d4d]/8 px-4 py-3 text-sm text-[#ffd5d5]">{error}</div> : null}

              <form onSubmit={handleLogin} className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
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
                  placeholder="Enter your password"
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

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#d3e0d2]/74">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#d8ff30]"
                    />
                    Remember email
                  </label>
                  <Link href="/forgot-password" className="font-semibold text-[#d8ff30] hover:text-[#ebffd2]">
                    Forgot password?
                  </Link>
                </div>

                <AuthTurnstile
                  ref={turnstileRef}
                  action="login"
                  className="flex justify-center pt-1"
                  onTokenChange={setTurnstileToken}
                />

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || providerBusy || loadingFingerprint}
                  className="group relative flex min-h-[62px] w-full items-center justify-center overflow-hidden rounded-[16px] border border-[#d8ff30]/30 bg-[linear-gradient(90deg,#d1ff00_0%,#20d7ca_100%)] px-6 py-3 text-xl font-black text-[#071006] shadow-[0_18px_40px_rgba(0,255,213,0.18),0_0_35px_rgba(216,255,48,0.22)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[66px] sm:text-2xl"
                >
                  <span className="relative z-10 inline-flex items-center gap-3">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Sign In"}
                    {!loading ? <MoveRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" /> : null}
                  </span>
                </motion.button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-[#d3e0d2]/60 sm:my-6">
                <div className="h-px flex-1 bg-white/10" />
                <span>OR CONTINUE WITH</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading || providerBusy}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-[#f2ffe4] transition hover:border-[#00ffd5]/25 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {providerLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FcGoogle size={18} />}
                  Google
                </button>
                <button
                  onClick={handleGithubLogin}
                  disabled={loading || providerBusy}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-[#f2ffe4] transition hover:border-[#00ffd5]/25 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {providerLoading === "github" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                  GitHub
                </button>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-2 text-sm text-[#d3e0d2]/72 sm:text-base">
                <span>Don&apos;t have an account?</span>
                <Link href="/register" className="group relative inline-flex items-center gap-2 font-semibold text-[#f4ffe6]">
                  <span className="relative">
                    Create account
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
