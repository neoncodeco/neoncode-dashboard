"use client";

import { useState } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { Headset, Minus, ShieldCheck, Sparkles, X } from "lucide-react";

export default function ChatWindow({ user, onClose }) {
  const chatId = `support_${user.uid}`;
  const [preferredLanguage, setPreferredLanguage] = useState("auto");

  return (
    <div
      className="relative flex h-[min(74vh,680px)] w-full flex-col overflow-hidden rounded-[30px] border shadow-[0_32px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      style={{
        borderColor: "var(--chat-shell-border)",
        background: "var(--chat-shell-bg)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_28%)] opacity-80" />
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--chat-backdrop-dot) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      <div
        className="pointer-events-none absolute -left-14 top-14 h-28 w-28 rounded-full blur-3xl"
        style={{ background: "var(--chat-glow-soft)" }}
      />

      <div
        className="relative flex items-center justify-between border-b px-4 py-4"
        style={{
          borderColor: "var(--chat-panel-border)",
          background: "var(--chat-header-bg)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,#f1f5f9,#cbd5e1)] text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
            style={{ borderColor: "var(--chat-avatar-ring)" }}
          >
            <span className="absolute inset-x-0 top-0 h-5 bg-white/40" />
            <Headset size={22} />
            <span
              className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full border-2"
              style={{ borderColor: "var(--chat-input-inner)", background: "var(--chat-online)" }}
            />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-[var(--chat-text-strong)]">Support Concierge</h3>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--chat-online)" }}>Active now</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"
            style={{ background: "var(--chat-icon-soft)", color: "var(--chat-text-muted)" }}
            aria-label="Minimize live chat"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"
            style={{ background: "var(--chat-icon-soft)", color: "var(--chat-text-muted)" }}
            aria-label="Close live chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        className="relative border-b px-4 py-3"
        style={{ borderColor: "var(--chat-panel-border)", background: "var(--chat-panel-bg)" }}
      >
        <div
          className="relative flex items-center justify-between gap-4 overflow-hidden rounded-[24px] border px-4 py-3 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          style={{
            borderColor: "var(--chat-panel-border)",
            background: "var(--chat-panel-bg)",
            color: "var(--chat-text-muted)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-24 blur-2xl"
            style={{ background: "var(--chat-glow-soft)" }}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2" style={{ color: "var(--chat-text-strong)" }}>
              <Sparkles size={14} style={{ color: "var(--chat-online)" }} />
              <p className="font-semibold">Priority support channel</p>
            </div>
            <p className="max-w-[15rem] text-[11px] leading-5" style={{ color: "var(--chat-text-muted)" }}>
              Billing, order update, service issue sob ekhane message dite parben.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="chat-language">Chat language</label>
            <select
              id="chat-language"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="rounded-full border px-3 py-1.5 text-[11px] font-medium outline-none transition focus:border-emerald-400/60"
              style={{
                borderColor: "var(--chat-pill-border)",
                background: "var(--chat-input-inner)",
                color: "var(--chat-text-strong)",
              }}
            >
              <option value="auto">Auto</option>
              <option value="en">English</option>
              <option value="bn">Bangla</option>
            </select>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 font-medium"
              style={{
                borderColor: "color-mix(in srgb, var(--chat-online) 20%, transparent)",
                background: "color-mix(in srgb, var(--chat-online) 12%, transparent)",
                color: "var(--chat-online)",
              }}
            >
              <ShieldCheck size={12} />
              Secure
            </span>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1" style={{ background: "var(--chat-canvas-bg)" }}>
        <ChatMessages chatId={chatId} />
      </div>

      <div className="relative border-t p-3" style={{ borderColor: "var(--chat-panel-border)", background: "var(--chat-header-bg)" }}>
        <ChatInput chatId={chatId} preferredLanguage={preferredLanguage} />
      </div>
    </div>
  );
}
