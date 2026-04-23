"use client";

import Link from "next/link";
import { MessageCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { userDashboardRoutes } from "@/lib/userDashboardRoutes";

const profileHref = `${userDashboardRoutes.account}#whatsapp-verify`;

export default function WhatsAppVerifyIntroModal({ onClose }) {
  const dismiss = () => {
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-intro-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        aria-label="Close dialog backdrop"
        onClick={dismiss}
      />

      <div className="relative z-[81] w-full max-w-lg overflow-hidden rounded-[28px] border border-emerald-200/40 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,253,245,0.96))] shadow-[0_28px_80px_rgba(15,23,42,0.35)]">
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full p-2 text-slate-500 transition hover:bg-white/80 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-emerald-100/80 bg-[linear-gradient(90deg,rgba(16,185,129,0.12),rgba(52,211,153,0.08))] px-6 pb-5 pt-7 sm:px-8 sm:pb-6 sm:pt-8">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <MessageCircle className="h-7 w-7" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/90">
                <Sparkles className="h-3.5 w-3.5" />
                Security & alerts
              </p>
              <h2
                id="whatsapp-intro-title"
                className="mt-3 text-xl font-black leading-tight text-slate-900 sm:text-2xl"
              >
                Verify your WhatsApp on profile
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                One-time setup keeps your account safer. After verification, important dashboard activity (for example
                payments and support tickets) can be sent to your WhatsApp so you stay in the loop.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3.5">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
            <p className="text-sm font-semibold leading-relaxed text-slate-700">
              Open <span className="font-black text-slate-900">Profile</span>, enter your WhatsApp number, request the
              code, then paste the OTP to complete verification.
            </p>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-sm font-medium text-slate-600">
            <li>OTP is sent to the number you provide (same flow you already use on profile).</li>
            <li>After verify, we can notify this WhatsApp when key actions happen on your dashboard.</li>
          </ul>
          <p className="text-xs font-medium leading-relaxed text-slate-500">
            Until you verify, this reminder appears again whenever you open Overview (after visiting another page).
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-emerald-100/80 bg-white/60 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={dismiss}
            className="order-2 rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:order-1"
          >
            Remind me later
          </button>
          <Link
            href={profileHref}
            className="order-1 inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(90deg,#059669,#10b981)] px-5 py-3.5 text-center text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition hover:brightness-105 sm:order-2"
          >
            Open profile & verify
          </Link>
        </div>
      </div>
    </div>
  );
}
