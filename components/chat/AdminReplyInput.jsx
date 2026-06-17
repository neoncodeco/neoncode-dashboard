"use client";

import useAppAuth from "@/hooks/useAppAuth";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminReplyInput({ chatId }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAppAuth();

  const sendReply = async () => {
    if (!text.trim() || loading) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/chat/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId, text }),
      });
      if (!res.ok) throw new Error("Reply failed");
      setText("");
    } catch (err) {
      console.error(err);
      await Swal.fire({
        title: "Reply failed",
        text: "Failed to send reply",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a reply..."
          disabled={loading}
          rows={1}
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white disabled:opacity-60"
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
          }}
        />
        <button
          type="button"
          onClick={sendReply}
          disabled={!text.trim() || loading}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-gray-400">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
