"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Headset, Loader2, ShieldCheck, X } from "lucide-react";
import ChatWindow from "./ChatWindow";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function LiveChatButton() {
  const { user } = useFirebaseAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleOpenChat = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    try {
      setLoading(true);

      if (!user) {
        setNotice("Live chat start korte login korte hobe.");
        return;
      }

      setNotice("");
      setOpen(true);
    } catch (err) {
      console.error("Failed to start live chat:", err);
      setNotice("Chat open kora jacche na. Ektu pore abar try korun.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-2 right-3 z-50 sm:bottom-3 sm:right-5">
      {open && user && (
        <div className="absolute bottom-[calc(100%+0.75rem)] right-0 w-[calc(100vw-1.5rem)] max-w-[410px] origin-bottom-right animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-300 sm:w-[calc(100vw-2rem)]">
          <ChatWindow user={user} onClose={() => setOpen(false)} />
        </div>
      )}

      {notice && (
        <div className="absolute bottom-[calc(100%+0.75rem)] right-0 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-amber-300/40 bg-[#12250b]/95 px-4 py-3 text-sm text-amber-50 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <p>{notice}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleOpenChat}
        disabled={loading}
        aria-label="Live Chat"
        aria-expanded={open}
        className={`
          group relative flex h-[3.75rem] w-[3.75rem] items-center justify-center overflow-hidden rounded-full border text-white shadow-[0_18px_45px_rgba(7,12,22,0.34)]
          transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] active:translate-y-0
          backdrop-blur-xl disabled:cursor-not-allowed disabled:opacity-80
          ${open ? "border-[#3d6c23] bg-[#17320d]" : "border-[#4d8f29] bg-[linear-gradient(135deg,#17340d_0%,#214311_52%,#3d7721_100%)]"}
        `}
      >
        {!loading && (
          <>
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_52%)] opacity-80" />
            <span className="absolute -right-3 -top-3 h-14 w-14 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
            <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
          </>
        )}

        <span className="relative flex h-full w-full items-center justify-center">
          {!open && !loading && (
            <>
              <span className="absolute h-11 w-11 animate-ping rounded-full bg-emerald-300/15" />
              <span className="absolute right-3 top-3 h-3 w-3 rounded-full border-2 border-[#214311] bg-emerald-400" />
            </>
          )}
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : open ? (
            <X className="h-5 w-5" />
          ) : (
            <Headset className="h-6 w-6 drop-shadow-[0_3px_8px_rgba(0,0,0,0.3)]" />
          )}
        </span>
      </button>
    </div>
    ,
    document.body
  );
}
