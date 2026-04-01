"use client";

import { useEffect, useState, useRef } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function ChatMessages({ chatId, currentRole = "user" }) {
  const [messages, setMessages] = useState([]);
  const { token } = useFirebaseAuth();
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
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
      className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden dark:bg-[#0c1830]"
      style={{ height: "100%" }}
    >
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm dark:border-[#2c4167] dark:bg-[#132546] dark:text-[#9fb3de]">
            Start the conversation...
          </p>
        </div>
      )}

      {messages.map((m) => {
        // ✅ Logic: Amar role jodi sender role er sathe mile jay, tobe ami sender (Right Side)
        const isMe = m.senderRole === currentRole;
        
        return (
          <div
            key={m.id}
            className={`flex w-full ${isMe ? "justify-end" : "justify-start animate-in slide-in-from-left-2"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 shadow-sm transition-all ${
                isMe
                  ? "ml-12 rounded-[20px] rounded-tr-[4px] bg-sky-500 text-white dark:bg-[#8ab4ff] dark:text-[#081227]"
                  : "mr-12 rounded-[20px] rounded-tl-[4px] border border-slate-200 bg-white text-slate-800 dark:border-[#2c4167] dark:bg-[#132546] dark:text-[#f5f8ff]"
              }`}
            >
              {/* Message Content */}
              {m.type === "text" && (
                <p className="text-[14px] leading-relaxed break-words">
                  {m.text}
                </p>
              )}

              {/* Image Content */}
              {m.type === "image" && (
                <div className="mt-1">
                  <img 
                    src={m.imageUrl} 
                    alt="attachment" 
                    className="max-w-full rounded-lg border border-black/5 cursor-zoom-in"
                  />
                </div>
              )}

              {/* Timestamp */}
              <div className={`mt-1.5 flex text-[10px] ${isMe ? "justify-end text-sky-100 dark:text-[#29426d]" : "justify-start text-slate-400 dark:text-[#8fa5cf]"}`}>
                {m.createdAt ? (
                  new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                ) : (
                  "Sending..."
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
