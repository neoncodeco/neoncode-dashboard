"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  Headset,
  LockKeyhole,
  Mail,
  ShieldAlert,
  ShieldX,
  X,
} from "lucide-react";

const ERROR_CONTENT = {
  AccessDenied: {
    icon: ShieldX,
    badge: "Access Restricted",
    title: "Sign-In Not Available",
    description:
      "Your account does not currently have permission to access this workspace. This usually happens when registration is still pending admin approval.",
    tips: [
      "Wait for an approval email from the Neon Code team.",
      "If you already received approval, try signing in again.",
      "Contact support if you believe this is a mistake.",
    ],
    primaryLabel: "Back to Sign In",
    primaryHref: "/login",
    secondaryLabel: "Check Approval Status",
    secondaryHref: "/login?pending_approval=1",
    tone: "amber",
  },
  Verification: {
    icon: Mail,
    badge: "Verification Required",
    title: "Email Verification Needed",
    description:
      "We could not verify your email address. Your verification link may have expired or already been used.",
    tips: ["Return to sign in and request a new verification email.", "Check your inbox and spam folder."],
    primaryLabel: "Back to Sign In",
    primaryHref: "/login?verify_email_sent=1",
    secondaryLabel: "Create Account",
    secondaryHref: "/register",
    tone: "sky",
  },
  CredentialsSignin: {
    icon: LockKeyhole,
    badge: "Authentication Failed",
    title: "Invalid Sign-In Attempt",
    description:
      "The email or password you entered is incorrect, or your account is temporarily locked after multiple failed attempts.",
    tips: ["Double-check your email and password.", "Use forgot password if you cannot remember your credentials."],
    primaryLabel: "Try Again",
    primaryHref: "/login",
    secondaryLabel: "Reset Password",
    secondaryHref: "/forgot-password",
    tone: "rose",
  },
  Configuration: {
    icon: ShieldAlert,
    badge: "Service Issue",
    title: "Authentication Service Unavailable",
    description:
      "We are unable to complete sign-in right now because of a temporary server configuration issue.",
    tips: ["Please try again in a few minutes.", "If the issue continues, contact support."],
    primaryLabel: "Back to Sign In",
    primaryHref: "/login",
    secondaryLabel: "Go to Home",
    secondaryHref: "/",
    tone: "slate",
  },
  Default: {
    icon: ShieldAlert,
    badge: "Sign-In Interrupted",
    title: "We Could Not Complete Sign-In",
    description:
      "Something interrupted the authentication process before your session could be created.",
    tips: ["Close this page and try signing in again.", "Use a supported browser with cookies enabled."],
    primaryLabel: "Back to Sign In",
    primaryHref: "/login",
    secondaryLabel: "Go to Home",
    secondaryHref: "/",
    tone: "slate",
  },
};

const TONE_STYLES = {
  amber: {
    iconWrap: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    badge: "border-amber-300/20 bg-amber-300/8 text-amber-100",
    glow: "from-amber-300/20 via-transparent to-transparent",
  },
  sky: {
    iconWrap: "border-sky-300/25 bg-sky-300/10 text-sky-200",
    badge: "border-sky-300/20 bg-sky-300/8 text-sky-100",
    glow: "from-sky-300/20 via-transparent to-transparent",
  },
  rose: {
    iconWrap: "border-rose-300/25 bg-rose-300/10 text-rose-200",
    badge: "border-rose-300/20 bg-rose-300/8 text-rose-100",
    glow: "from-rose-300/20 via-transparent to-transparent",
  },
  slate: {
    iconWrap: "border-white/15 bg-white/8 text-[#d8ff30]",
    badge: "border-white/12 bg-white/6 text-[#eaf7dc]",
    glow: "from-[#d8ff30]/16 via-transparent to-transparent",
  },
};

function resolveContent(errorCode) {
  const key = String(errorCode || "").trim();
  return ERROR_CONTENT[key] || ERROR_CONTENT.Default;
}

export default function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const content = resolveContent(errorCode);
  const tone = TONE_STYLES[content.tone] || TONE_STYLES.slate;
  const Icon = content.icon;

  const handleClose = () => {
    router.push("/");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#000f08] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,44,22,0.38),transparent_42%),radial-gradient(circle_at_82%_14%,rgba(0,255,213,0.08),transparent_22%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(216,255,48,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,213,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[920px] items-center justify-center">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative w-full overflow-hidden rounded-[30px] border border-[#73839c]/45 bg-[linear-gradient(180deg,rgba(10,14,22,0.96),rgba(6,10,18,0.94))] p-6 shadow-[0_20px_90px_rgba(0,0,0,0.48),0_0_40px_rgba(0,255,213,0.08)] sm:p-8 lg:p-10"
        >
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.glow}`}
          />

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            title="Close"
            className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-[#dbe8df]/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:right-6 sm:top-6"
          >
            <X size={18} />
          </button>

          <div className="relative z-10">
            <div className="flex flex-col gap-6 pr-12 sm:flex-row sm:items-start sm:justify-between sm:pr-14">
              <div className="inline-flex items-center gap-4">
                <Image
                  src="/Neon-Studio-icon.png"
                  alt="Neon Code logo"
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                  priority
                />
                <div>
                  <p className="text-[1.35rem] font-black tracking-[0.22em] text-[#f5ffe6] sm:text-[1.55rem]">
                    <span className="text-[#d8ff30]">NEON</span>CODE
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[#d6e5d6]/55">
                    Secure Workspace Access
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit items-center rounded-full border px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${tone.badge}`}
              >
                {content.badge}
              </span>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div>
                <div
                  className={`mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] border ${tone.iconWrap}`}
                >
                  <Icon size={30} />
                </div>

                <h1 className="text-3xl font-black leading-tight text-[#f8ffec] sm:text-4xl">{content.title}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d3e5d9]/76 sm:text-base">
                  {content.description}
                </p>

                <div className="mt-6 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#d8ff30]">
                    <Clock3 size={14} />
                    What You Can Do
                  </div>
                  <ul className="space-y-2.5">
                    {content.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2.5 text-sm leading-6 text-[#dbe8df]/82">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8ff30]" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 sm:p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d6e5d6]/55">Next Step</p>
                <p className="mt-3 text-lg font-bold text-[#f5ffe6]">
                  {errorCode === "AccessDenied"
                    ? "Your account may still be waiting for approval."
                    : "Return to sign in and try again."}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#d3e5d9]/70">
                  Use the actions below to continue. If you need help, our support team can review your account status.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href={content.primaryHref}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(90deg,#d8ff30,#b7df69)] px-5 py-3.5 text-sm font-black text-[#17210e] shadow-[0_10px_30px_rgba(216,255,48,0.18)] transition hover:brightness-95"
                  >
                    {content.primaryLabel}
                    <ArrowRight size={16} />
                  </Link>

                  <Link
                    href={content.secondaryHref}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-white/12 bg-white/[0.03] px-5 py-3.5 text-sm font-bold text-[#eef8e8] transition hover:bg-white/[0.06]"
                  >
                    <Headset size={16} />
                    {content.secondaryLabel}
                  </Link>
                </div>

                {errorCode ? (
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9fb0a4]/70">
                    Reference: {errorCode}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
