"use client";

import { useState } from "react";
import ImageUploader from "../ImageUploader";
import { ImagePlus, Loader2, Paperclip, SendHorizontal, X } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function ChatInput({ chatId, preferredLanguage = "auto" }) {
  const { token } = useFirebaseAuth();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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
    <div>
      {image && (
        <div className="mb-3">
          <div
            className="relative h-24 w-24 overflow-hidden rounded-2xl border shadow-[0_16px_35px_rgba(0,0,0,0.22)] ring-1 ring-black/10"
            style={{ borderColor: "var(--chat-panel-border)" }}
          >
            <img src={image.url} alt="preview" className="h-full w-full object-cover" />
            <button
              onClick={() => setImage(null)}
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition hover:bg-black"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div
        className="rounded-[28px] border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        style={{ borderColor: "var(--chat-panel-border)", background: "var(--chat-input-shell)" }}
      >
        <div
          className="relative flex items-end gap-2 overflow-hidden rounded-[24px] border p-2.5"
          style={{ borderColor: "var(--chat-input-border)", background: "var(--chat-input-inner)" }}
        >
          <div
            className="pointer-events-none absolute left-6 top-0 h-14 w-20 blur-2xl"
            style={{ background: "var(--chat-glow-soft)" }}
          />
          <div className="flex items-center transition" style={{ color: "var(--chat-text-muted)" }}>
            <ImageUploader
              onUploadSuccess={setImage}
              customIcon={
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                  style={{ borderColor: "var(--chat-pill-border)", background: "var(--chat-icon-soft)" }}
                >
                  {image ? <ImagePlus size={18} /> : <Paperclip size={18} />}
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
              className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-1 py-2 text-sm focus:outline-none"
              style={{ color: "var(--chat-text-strong)" }}
            />
            <p className="px-1 pb-1 text-[11px]" style={{ color: "var(--chat-text-faint)" }}>
              Press Enter to send
            </p>
          </div>

          <button
            onClick={send}
            disabled={(!text.trim() && !image) || sending || !token}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${text.trim() || image ? "hover:scale-[1.03] active:scale-95" : "cursor-not-allowed"}`}
            style={
              text.trim() || image
                ? {
                    background: "var(--chat-user-bubble)",
                    color: "var(--chat-user-text)",
                    boxShadow: "var(--chat-send-shadow)",
                  }
                : {
                    background: "var(--chat-icon-soft)",
                    color: "var(--chat-text-faint)",
                  }
            }
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 px-1 text-xs text-amber-200">
          {error}
        </p>
      )}
    </div>
  );
}
