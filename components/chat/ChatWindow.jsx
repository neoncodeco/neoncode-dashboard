"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import {
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Home,
  MessageSquare,
  Phone,
  Search,
  X,
} from "lucide-react";

function BottomTab({ active, label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-[18px] py-2.5 transition ${
        active ? "text-black" : "text-black/45"
      }`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? "bg-black text-white" : "bg-transparent"}`}>
        <Icon size={18} />
      </div>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function IconBadge({ children, tone = "slate" }) {
  const toneClass =
    tone === "gold"
      ? "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,226,0.92))] text-amber-950 shadow-[0_10px_20px_rgba(245,158,11,0.16)]"
      : tone === "green"
        ? "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(235,251,243,0.92))] text-emerald-950 shadow-[0_10px_20px_rgba(16,185,129,0.14)]"
        : tone === "blue"
          ? "border-sky-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(232,244,255,0.92))] text-sky-950 shadow-[0_10px_20px_rgba(59,130,246,0.14)]"
          : "border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,247,250,0.92))] text-slate-950 shadow-[0_10px_20px_rgba(15,23,42,0.12)]";

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneClass}`}>
      {children}
    </div>
  );
}

function TicketCard() {
  return (
    <button
      type="button"
      className="relative w-full overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,250,0.9))] p-4 text-left shadow-[0_18px_34px_rgba(0,0,0,0.1)] ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.05),transparent_35%)]" />
      <h4 className="text-[1.05rem] font-semibold text-slate-900">Create a ticket</h4>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-3">
          <span className="text-[0.98rem] leading-6 text-slate-700">Phone verification issues (No code)</span>
          <IconBadge tone="blue">
            <Phone size={18} />
          </IconBadge>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-3">
          <span className="text-[0.98rem] leading-6 text-slate-700">Dispute Request</span>
          <IconBadge tone="gold">
            <AlertTriangle size={18} />
          </IconBadge>
        </div>
      </div>
    </button>
  );
}

export default function ChatWindow({ user, onClose }) {
  const [activeTab, setActiveTab] = useState("messages");

  const avatars = useMemo(
    () => [user?.photoURL || null, "/neon-code-logo.jpg"],
    [user?.photoURL]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="relative flex h-[min(78vh,760px)] w-full flex-col overflow-hidden rounded-[30px] border border-black/10 shadow-[0_38px_90px_rgba(0,0,0,0.45)]"
      style={{ background: "#c9ff00" }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(201,255,0,1),rgba(201,255,0,0.98))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_38%)]" />
      <div className="absolute inset-x-6 top-20 h-24 rounded-full bg-white/8 blur-xl" />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {activeTab !== "messages" ? (
          <div className="flex items-start justify-between px-5 pt-4 sm:px-6">
            <div className="flex items-center gap-1.5">
              {avatars.map((src, index) => (
                <div
                  key={`${src || "avatar"}-${index}`}
                  className={`relative h-11 w-11 overflow-hidden rounded-full border-2 border-white shadow-[0_8px_20px_rgba(0,0,0,0.14)] ${index > 0 ? "-ml-2" : ""}`}
                >
                  {src ? (
                    <Image
                      src={src}
                      alt={index === 0 ? "User" : "Support"}
                      fill
                      className="object-cover"
                      unoptimized={index === 0 ? Boolean(user?.photoURL) : true}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white text-xs font-black text-slate-800">
                      NC
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/30 text-black transition hover:bg-white/50"
              aria-label="Close live chat"
            >
              <X size={22} strokeWidth={2.2} />
            </button>
          </div>
        ) : null}

        <div
          className={`flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            activeTab === "messages" ? "px-3 pb-3 pt-3 sm:px-4" : "px-4 pb-4 pt-6 sm:px-5"
          }`}
        >
          {activeTab === "home" ? (
            <div className="space-y-4">
              <div className="px-2 pt-6 sm:px-3">
                <h2 className="max-w-[11ch] text-[2.55rem] font-extrabold leading-[0.95] tracking-tight text-black sm:text-[3.1rem]">
                  Hi there <span className="inline-block align-middle text-[2rem]">{"\u{1F44B}"}</span>
                  <br />
                  How can we help?
                </h2>
              </div>

              <TicketCard />

              <button
                type="button"
                onClick={() => setActiveTab("messages")}
                className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,250,0.9))] px-4 py-4 text-left shadow-[0_18px_34px_rgba(0,0,0,0.1)] ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <IconBadge tone="blue">
                    <MessageSquare size={18} />
                  </IconBadge>
                  <div>
                    <h4 className="text-[1.05rem] font-semibold text-slate-900">Ask a question</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-400">AI Agent and team can help</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-900" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("help")}
                className="flex w-full items-start justify-between gap-4 rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,250,0.9))] px-4 py-4 text-left shadow-[0_18px_34px_rgba(0,0,0,0.1)] ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <IconBadge tone="green">
                    <Search size={18} />
                  </IconBadge>
                  <div>
                    <h4 className="text-[1.05rem] font-semibold text-slate-900">Search for help</h4>
                    <div className="mt-2 rounded-[14px] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-400">
                      How to set-up Virtual Card&apos;s filters
                    </div>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 text-slate-900" />
              </button>
            </div>
          ) : activeTab === "messages" ? (
            <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_28px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <div className="h-10 w-10" aria-hidden="true" />
                <p className="text-[1.4rem] font-semibold tracking-tight text-slate-900">Messages</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-500 transition hover:text-slate-700"
                  aria-label="Close live chat"
                >
                  <X size={22} strokeWidth={2} />
                </button>
              </div>

              <div className="min-h-0 flex-1 bg-white">
                <ChatMessages chatId={`support_${user.uid}`} variant="light" />
              </div>

              <div className="border-t border-slate-100 bg-white p-3 sm:p-4">
                <ChatInput chatId={`support_${user.uid}`} preferredLanguage="auto" variant="light" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,250,0.9))] p-4 shadow-[0_18px_34px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
                <p className="text-sm font-semibold text-slate-900">Popular help topics</p>
                <div className="mt-4 space-y-3">
                  {[
                    "How to verify your phone number",
                    "How to resolve a payment dispute",
                    "How to add a new payment method",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setActiveTab("messages")}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-white"
                    >
                      <span>{item}</span>
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-3 pb-3 pt-2">
          <div className="mx-auto flex max-w-[22rem] items-center justify-between rounded-full border border-slate-200/80 bg-white/90 px-2 py-2 shadow-[0_18px_45px_rgba(0,0,0,0.12)] backdrop-blur-xl">
            <BottomTab active={activeTab === "home"} label="Home" icon={Home} onClick={() => setActiveTab("home")} />
            <BottomTab active={activeTab === "messages"} label="Messages" icon={MessageSquare} onClick={() => setActiveTab("messages")} />
            <BottomTab active={activeTab === "help"} label="Help" icon={HelpCircle} onClick={() => setActiveTab("help")} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
