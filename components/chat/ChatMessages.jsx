"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Sparkles, User2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function ChatMessages({ chatId, currentRole = "user", variant = "dark" }) {
  const [messages, setMessages] = useState([]);
  const { token } = useFirebaseAuth();
  const scrollRef = useRef(null);
  const isLight = variant === "light";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!chatId || !token) return;

    let active = true;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?chatId=${encodeURIComponent(chatId)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();

        if (active && data?.ok) {
          setMessages(data.messages || []);
          return;
        }

        if (active && res.status === 404) {
          setMessages([]);
        }
      } catch (err) {
        console.error("CHAT FETCH ERROR:", err);
      }
    };

    void fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [chatId, token]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-4"
      style={{ height: "100%" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex max-w-md justify-center pb-4"
      >
        <span
          className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] shadow-sm"
          style={{
            borderColor: isLight ? "rgba(15,23,42,0.08)" : "var(--chat-pill-border)",
            background: isLight ? "#f3f4f6" : "var(--chat-pill-bg)",
            color: isLight ? "#64748b" : "var(--chat-text-faint)",
          }}
        >
          Today
        </span>
      </motion.div>

      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={`max-w-xs rounded-[30px] p-6 text-center shadow-[0_24px_50px_rgba(0,0,0,0.22)] ${
              isLight
                ? "border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_20px_45px_rgba(148,163,184,0.22)]"
                : "border border-white/10 bg-white/[0.04]"
            }`}
          >
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                isLight
                  ? "border border-[rgba(194,235,45,0.55)] bg-[linear-gradient(180deg,#C2EB2D,#B2DF21)] text-[var(--dashboard-accent-text)]"
                  : "bg-emerald-400/10 text-emerald-300"
              }`}
            >
              <Sparkles size={18} />
            </div>
            <p className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
              Start a smooth support chat
            </p>
            <p className={`mt-2 text-xs leading-6 ${isLight ? "text-slate-600" : "text-white/65"}`}>
              Ask about billing, order updates, service issue, or anything you need help with.
            </p>
          </motion.div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {messages.map((m) => {
          const isMe = m.senderRole === currentRole;
          const timeLabel = m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Sending...";

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className={`mb-4 flex w-full items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe ? (
              <div className="mb-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-300 shadow-[0_10px_25px_rgba(0,0,0,0.18)]">
                <Bot size={16} />
              </div>
            ) : null}

              <div className={`max-w-[82%] sm:max-w-[76%] ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className={`relative overflow-hidden rounded-[24px] px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-all ${isMe ? "rounded-br-[8px]" : "rounded-bl-[8px] border border-white/10"}`}
                  style={
                    isMe
                      ? {
                          background: isLight
                            ? "#c9ff00"
                            : "linear-gradient(135deg,rgba(16,185,129,0.95),rgba(34,197,94,0.88))",
                          color: isLight ? "#111827" : "white",
                          boxShadow: isLight ? "0 14px 30px rgba(201,255,0,0.25)" : "0 18px 42px rgba(16,185,129,0.22)",
                        }
                      : {
                          borderColor: isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.08)",
                          background: isLight ? "#f8fafc" : "rgba(255,255,255,0.05)",
                          color: isLight ? "#0f172a" : "rgba(255,255,255,0.92)",
                        }
                  }
                >
                  {!isMe ? (
                    <span className="absolute inset-y-0 left-0 w-1 bg-emerald-300" />
                  ) : null}

                  {m.type === "text" && (
                    <p className="break-words pr-1 text-[14px] leading-7">
                      {m.text}
                    </p>
                  )}

                  {m.type === "image" && (
                    <div className="mt-1">
                      <img
                        src={m.imageUrl}
                        alt="attachment"
                        className="max-w-full rounded-2xl border border-white/10 object-cover shadow-sm"
                      />
                    </div>
                  )}
                </div>

                <div
                  className={`mt-1 flex items-center gap-2 px-1 text-[11px] ${isMe ? "justify-end" : "justify-start"}`}
                  style={{ color: isLight ? "rgba(15,23,42,0.45)" : "rgba(255,255,255,0.45)" }}
                >
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                    style={{
                      background: isMe
                        ? (isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.14)")
                        : (isLight ? "#e2e8f0" : "rgba(255,255,255,0.08)"),
                      color: isMe ? (isLight ? "#111827" : "white") : (isLight ? "#64748b" : "rgba(255,255,255,0.7)"),
                    }}
                  >
                    {isMe ? <User2 size={10} /> : <Bot size={10} />}
                  </span>
                  <span>{timeLabel}</span>
                </div>
              </div>

              {isMe ? (
                <div
                  className={`mb-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.18)] ${
                    isLight
                      ? "border border-slate-200 bg-white text-slate-900"
                      : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  }`}
                >
                  <User2 size={16} />
                </div>
              ) : null}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
