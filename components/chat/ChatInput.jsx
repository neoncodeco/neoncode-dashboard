"use client";

import { useState } from "react";
import ImageUploader from "../ImageUploader";
import { ImagePlus, Loader2, Paperclip, SendHorizontal, X } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function ChatInput({ chatId, preferredLanguage = "auto", variant = "dark" }) {
  const { token } = useFirebaseAuth();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const isLight = variant === "light";

  const send = async () => {
    if ((!text.trim() && !image) || sending || !token) return;

    try {
      setSending(true);
      setError("");

      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          type: image?.url ? "image" : "text",
          text: text.trim(),
          imageUrl: image?.url || null,
          preferredLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send message");
      }

      setText("");
      setImage(null);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Message send failed");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="p-0">
      {image && (
        <div className="mb-1">
          <div
            className="relative h-20 w-20 overflow-hidden border rounded-b-2xl"
            style={{ borderColor: "var(--chat-panel-border)" }}
          >
            <img src={image.url} alt="preview" className="h-full w-full object-cover" />
            <button
              onClick={() => setImage(null)}
              className="absolute right-1 top-1 bg-black/70 p-1 text-white transition hover:bg-black"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div
        className={`relative flex items-center gap-1 border px-1 py-1 ${isLight ? "border-slate-200 bg-[#f9faf6]" : ""}`}
        style={{
          borderColor: isLight ? "rgba(15,23,42,0.12)" : "var(--chat-input-border)",
          background: isLight ? "#f9faf6" : "var(--chat-input-inner)",
        }}
      >
        <div className="flex items-center transition" style={{ color: isLight ? "#64748b" : "var(--chat-text-muted)" }}>
          <ImageUploader
            onUploadSuccess={setImage}
            compact
            customIcon={
              <span
                className="flex h-8 w-8 items-center justify-center border"
                style={{
                  borderColor: isLight ? "rgba(148,163,184,0.25)" : "var(--chat-pill-border)",
                  background: isLight ? "#eef2e7" : "var(--chat-icon-soft)",
                }}
              >
                {image ? <ImagePlus size={16} /> : <Paperclip size={16} />}
              </span>
            }
          />
        </div>

        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type your message..."
            className="max-h-20 min-h-[30px] w-full resize-none bg-transparent px-1 py-0.5 text-sm leading-5 focus:outline-none"
            style={{ color: isLight ? "#0f172a" : "var(--chat-text-strong)" }}
          />
        </div>

        <button
          onClick={send}
          disabled={(!text.trim() && !image) || sending || !token}
          className={`flex h-8 w-8 items-center justify-center border transition-all ${text.trim() || image ? "hover:scale-[1.03] active:scale-95" : "cursor-not-allowed"}`}
          style={
            text.trim() || image
              ? {
                  background: isLight ? "linear-gradient(180deg,#C2EB2D,#B2DF21)" : "var(--chat-user-bubble)",
                  color: isLight ? "#111827" : "var(--chat-user-text)",
                  borderColor: isLight ? "rgba(194,235,45,0.68)" : "transparent",
                }
              : {
                  background: isLight ? "#e9eef3" : "var(--chat-icon-soft)",
                  color: isLight ? "#94a3b8" : "var(--chat-text-faint)",
                  borderColor: isLight ? "rgba(148,163,184,0.25)" : "transparent",
                }
          }
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
        </button>
      </div>

      {error && (
        <p className={`mt-1 text-xs ${isLight ? "text-amber-600" : "text-amber-200"}`}>
          {error}
        </p>
      )}
    </div>
  );
}
