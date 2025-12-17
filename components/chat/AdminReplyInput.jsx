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
    <div className="bg-white border-t border-gray-200 p-4">
      <div className={`
        relative flex flex-col w-full rounded-xl border transition-all duration-200
        ${loading ? 'bg-gray-50 opacity-70' : 'bg-white shadow-sm'}
        focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-50
      `}>
        
        {/* Textarea for longer replies */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a professional reply..."
          disabled={loading}
          className="w-full bg-transparent border-none focus:ring-0 text-[15px] p-4 text-slate-900 placeholder:text-slate-400 resize-none min-h-[100px]"
          rows={3}
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 border-t border-gray-100 rounded-b-xl">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium ml-2">
            <span className="flex items-center gap-1 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">
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
                ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700 active:scale-95"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"}
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
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Admin Dashboard Mode
        </p>
      </div>
    </div>
  );
}