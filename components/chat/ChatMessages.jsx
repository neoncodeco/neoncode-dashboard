"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Sparkles, User2 } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function ChatMessages({ chatId, currentRole = "user" }) {
  const [messages, setMessages] = useState([]);
  const { token } = useFirebaseAuth();
  const scrollRef = useRef(null);

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
      <div className="mx-auto flex max-w-md justify-center pb-4">
        <span
          className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] shadow-sm"
          style={{
            borderColor: "var(--chat-pill-border)",
            background: "var(--chat-pill-bg)",
            color: "var(--chat-text-faint)",
          }}
        >
          Today
        </span>
      </div>

      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div
            className="max-w-xs rounded-[28px] border p-6 text-center shadow-[0_20px_45px_rgba(0,0,0,0.22)]"
            style={{ borderColor: "var(--chat-panel-border)", background: "var(--chat-panel-bg)" }}
          >
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "color-mix(in srgb, var(--chat-online) 14%, transparent)", color: "var(--chat-online)" }}
            >
              <Sparkles size={18} />
            </div>
            <p className="text-sm font-semibold text-[var(--chat-text-strong)]">Start a smooth support chat</p>
            <p className="mt-2 text-xs leading-6" style={{ color: "var(--chat-text-muted)" }}>
              Ask about billing, order updates, service issue, or anything you need help with.
            </p>
          </div>
        </div>
      )}

      {messages.map((m) => {
        const isMe = m.senderRole === currentRole;
        const timeLabel = m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Sending...";

        return (
          <div
            key={m.id}
            className={`mb-4 flex w-full items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
          >
            {!isMe ? (
              <div
                className="mb-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-[0_10px_25px_rgba(0,0,0,0.18)]"
                style={{
                  borderColor: "var(--chat-avatar-ring)",
                  background: "var(--chat-pill-bg)",
                  color: "var(--chat-online)",
                }}
              >
                <Bot size={16} />
              </div>
            ) : null}

            <div className={`max-w-[82%] sm:max-w-[76%] ${isMe ? "items-end" : "items-start"}`}>
              <div
                className={`relative overflow-hidden rounded-[24px] px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-all ${isMe ? "rounded-br-[8px]" : "rounded-bl-[8px] border"}`}
                style={
                  isMe
                    ? {
                        background: "var(--chat-user-bubble)",
                        color: "var(--chat-user-text)",
                        boxShadow: "0 18px 42px color-mix(in srgb, var(--chat-glow) 85%, transparent)",
                      }
                    : {
                        borderColor: "var(--chat-agent-border)",
                        background: "var(--chat-agent-bubble)",
                        color: "var(--chat-agent-text)",
                      }
                }
              >
                {!isMe ? (
                  <span className="absolute inset-y-0 left-0 w-1" style={{ background: "var(--chat-online)" }} />
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
                      className="max-w-full rounded-2xl border border-black/5 object-cover shadow-sm"
                    />
                  </div>
                )}
              </div>

              <div
                className={`mt-1 flex items-center gap-2 px-1 text-[11px] ${isMe ? "justify-end" : "justify-start"}`}
                style={{ color: "var(--chat-text-faint)" }}
              >
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                  style={{
                    background: isMe
                      ? "color-mix(in srgb, var(--chat-online) 14%, transparent)"
                      : "var(--chat-pill-bg)",
                    color: isMe ? "var(--chat-online)" : "var(--chat-text-muted)",
                  }}
                >
                  {isMe ? <User2 size={10} /> : <Bot size={10} />}
                </span>
                <span>{timeLabel}</span>
              </div>
            </div>

            {isMe ? (
              <div
                className="mb-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-[0_10px_25px_rgba(0,0,0,0.18)]"
                style={{
                  borderColor: "color-mix(in srgb, var(--chat-online) 22%, transparent)",
                  background: "color-mix(in srgb, var(--chat-online) 12%, transparent)",
                  color: "var(--chat-online)",
                }}
              >
                <User2 size={16} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
