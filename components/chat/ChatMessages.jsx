"use client";

import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, auth } from "@/lib/firebaseClient";

export default function ChatMessages({ chatId, currentRole = "user" }) {
  const [messages, setMessages] = useState([]);
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
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return unsub;
  }, [chatId]);

  return (
    <div 
      ref={scrollRef} 
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 "
      style={{ height: '100%' }}
    >
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-xs text-zinc-400  px-4 py-2 rounded-full shadow-sm">
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
                  ? "bg-blue-600 text-white rounded-[20px] rounded-tr-[4px] ml-12"
                  : "bg-white border border-gray-100 text-zinc-800 rounded-[20px] rounded-tl-[4px] mr-12"
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
              <div className={`text-[10px] mt-1.5 flex ${isMe ? 'justify-end text-blue-100' : 'justify-start text-zinc-400'}`}>
                {m.createdAt?.seconds ? (
                  new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], {
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