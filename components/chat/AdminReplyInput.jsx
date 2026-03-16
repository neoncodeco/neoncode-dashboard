"use client";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useState } from "react";
import { Send, Loader2, Command } from "lucide-react";

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
      alert("Failed to send reply");
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
    <div className="border-t border-[#22375d] bg-[#0f1d38] p-4">
      <div className={`
        relative flex w-full flex-col rounded-xl border transition-all duration-200
        ${loading ? 'bg-[#132546] opacity-70' : 'bg-[#132546] shadow-sm'}
        border-[#2c4167] focus-within:border-[#8ab4ff] focus-within:ring-2 focus-within:ring-[#8ab4ff]/15
      `}>
        
        {/* Textarea for longer replies */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a professional reply..."
          disabled={loading}
          className="min-h-[100px] w-full resize-none border-none bg-transparent p-4 text-[15px] text-[#f5f8ff] placeholder:text-[#8fa5cf] focus:ring-0"
          rows={3}
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-between rounded-b-xl border-t border-[#22375d] bg-[#101c37] px-3 py-2">
          <div className="ml-2 flex items-center gap-2 text-[11px] font-medium text-[#9fb3de]">
            <span className="flex items-center gap-1 rounded border border-[#2c4167] bg-[#132546] px-1.5 py-0.5 shadow-sm">
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
                ? "bg-[#8ab4ff] text-[#081227] shadow-md hover:bg-[#9fc0ff] active:scale-95"
                : "cursor-not-allowed bg-[#243a63] text-[#7f96c7]"}
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7f96c7]">
          Admin Dashboard Mode
        </p>
      </div>
    </div>
  );
}
