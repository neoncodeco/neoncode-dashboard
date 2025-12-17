"use client";

import { useState } from "react";
import { MessageCircle, X, Loader2 } from "lucide-react";
import ChatWindow from "./ChatWindow";
import { auth } from "@/lib/firebaseClient";
import { ensureAuth } from "@/hooks/useEnsureAuth";

export default function LiveChatButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenChat = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    try {
      setLoading(true);
      // ✅ Guest / Logged-in — both supported
      await ensureAuth();
      setOpen(true);
    } catch (err) {
      console.error("Failed to start live chat:", err);
      alert("Unable to start chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-10 z-50 flex flex-col items-end">
      {/* Chat Window Container */}
      {open && auth.currentUser && (
        <div className="mb-4 transition-all duration-300 transform origin-bottom-right scale-100 opacity-100">
          <ChatWindow
            user={auth.currentUser}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      {/* Professional Floating Button */}
      <button
        onClick={handleOpenChat}
        disabled={loading}
        className={`
          relative flex items-center justify-center 
          w-14 h-14 md:w-16 md:h-16 
          text-white rounded-full shadow-2xl 
          transition-all duration-300 ease-in-out
          hover:scale-110 active:scale-95
          ${open ? 'bg-[#214311] rotate-90' : 'bg-blue-600 hover:bg-blue-700'}
          disabled:cursor-not-allowed
        `}
        aria-label="Live Chat"
      >
        {loading ? (
          <Loader2 className="w-7 h-7 animate-spin" />
        ) : open ? (
          <X className="w-7 h-7" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7" />
            {/* Online Indicator Dot */}
            <span className="absolute top-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white bg-green-500"></span>
          </>
        )}
      </button>

      {/* Tooltip (Optional) */}
      {!open && !loading && (
        <div className="absolute right-20 bottom-3 bg-white px-3 py-1 rounded-lg shadow-md border border-gray-100 hidden md:block whitespace-nowrap">
          <p className="text-sm font-medium text-[#214311]">Chat with us!</p>
        </div>
      )}
    </div>
  );
}