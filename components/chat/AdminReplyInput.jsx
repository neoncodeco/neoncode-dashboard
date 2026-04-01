"use client";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useState } from "react";
import { Send, Loader2, Command } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminReplyInput({ chatId }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useFirebaseAuth();

  const sendReply = async () => {
    if (!text.trim() || loading) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/chat/reply", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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

  // Keyboard shortcut: Ctrl + Enter to send
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      sendReply();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4 dark:border-[#22375d] dark:bg-[#0f1d38]">
      <div className={`
        relative flex w-full flex-col rounded-xl border transition-all duration-200
        ${loading ? 'bg-slate-50 opacity-70 dark:bg-[#132546]' : 'bg-white shadow-sm dark:bg-[#132546]'}
        border-slate-200 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 dark:border-[#2c4167] dark:focus-within:border-[#8ab4ff] dark:focus-within:ring-[#8ab4ff]/15
      `}>
        
        {/* Textarea for longer replies */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a professional reply..."
          disabled={loading}
          className="min-h-[100px] w-full resize-none border-none bg-transparent p-4 text-[15px] text-slate-800 placeholder:text-slate-400 focus:ring-0 dark:text-[#f5f8ff] dark:placeholder:text-[#8fa5cf]"
          rows={3}
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-between rounded-b-xl border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-[#22375d] dark:bg-[#101c37]">
          <div className="ml-2 flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-[#9fb3de]">
            <span className="flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 shadow-sm dark:border-[#2c4167] dark:bg-[#132546]">
              <Command size={10} /> + Enter
            </span>
            <span>to send faster</span>
          </div>

          <button
            onClick={sendReply}
            disabled={!text.trim() || loading}
            className={`
              flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all
              ${text.trim() && !loading
                ? "bg-sky-600 text-white shadow-md hover:bg-sky-700 active:scale-95 dark:bg-[#8ab4ff] dark:text-[#081227] dark:hover:bg-[#9fc0ff]"
                : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-[#243a63] dark:text-[#7f96c7]"}
            `}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Reply</span>
                <Send size={16} />
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Quick Tips */}
      <div className="mt-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#7f96c7]">
          Admin Dashboard Mode
        </p>
      </div>
    </div>
  );
}
