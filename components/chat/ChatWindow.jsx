"use client";

import { useState } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { Headset, Minus, X } from "lucide-react";

export default function ChatWindow({ user, onClose }) {
  const chatId = `support_${user.uid}`;
  const [preferredLanguage, setPreferredLanguage] = useState("auto");

  return (
    <div className="flex h-[min(72vh,600px)] w-full flex-col overflow-hidden rounded-[28px] border border-[#345a21] bg-[linear-gradient(180deg,rgba(21,47,12,0.98)_0%,rgba(14,29,8,0.98)_100%)] shadow-[0_25px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-[linear-gradient(135deg,rgba(61,119,33,0.34),rgba(255,255,255,0.03))] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner shadow-white/5">
            <Headset size={22} />
            <span className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full border-2 border-[#1b360f] bg-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live Support</h3>
            <p className="text-xs text-emerald-300">Online now</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Minimize live chat"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close live chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#31551d] bg-black/10 px-4 py-3 text-xs text-[#dceccc]">
          <div>
            <p className="font-medium text-white">Fast support channel</p>
            <p>Billing, order update, service issue sob ekhane message dite parben.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="chat-language">Chat language</label>
            <select
              id="chat-language"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="rounded-full border border-[#46732d] bg-[#1d3a11] px-3 py-1 text-[11px] font-medium text-[#ddf0cf] outline-none"
            >
              <option value="auto">Auto</option>
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
            <span className="shrink-0 rounded-full bg-emerald-400/15 px-3 py-1 font-medium text-emerald-300">
              Secure
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-[linear-gradient(180deg,rgba(242,246,238,0.98),rgba(232,239,227,0.98))]">
        <ChatMessages chatId={chatId} />
      </div>

      <div className="border-t border-[#345a21] bg-[#16300d] p-3">
        <ChatInput chatId={chatId} preferredLanguage={preferredLanguage} />
      </div>
    </div>
  );
}
