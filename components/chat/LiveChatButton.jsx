"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Headset, Loader2, ShieldCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ChatWindow from "./ChatWindow";
import useAppAuth from "@/hooks/useAppAuth";

export default function LiveChatButton() {
  const { user } = useAppAuth();
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

  useEffect(() => {
    const handleExternalOpen = () => {
      if (!user) {
        setNotice("Live chat start korte login korte hobe.");
        return;
      }
      setNotice("");
      setOpen(true);
    };

    window.addEventListener("open-live-chat", handleExternalOpen);
    return () => window.removeEventListener("open-live-chat", handleExternalOpen);
  }, [user]);

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
    <div className="fixed bottom-[5.8rem] right-3 z-50 block md:bottom-[4rem] md:right-4 lg:bottom-4 lg:right-5">
      <AnimatePresence>
        {open && user ? (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="absolute bottom-[calc(100%+0.85rem)] right-0 w-[calc(100vw-1.5rem)] max-w-[338px] origin-bottom-right sm:w-[calc(100vw-2rem)] sm:max-w-[352px] md:max-w-[365px] lg:max-w-[390px]"
          >
            <ChatWindow user={user} onClose={() => setOpen(false)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {notice ? (
          <motion.div
            key="chat-notice"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="absolute bottom-[calc(100%+0.75rem)] right-0 w-[min(22rem,calc(100vw-2rem))] rounded-[24px] border border-amber-300/30 bg-[linear-gradient(180deg,rgba(23,37,16,0.98),rgba(10,18,8,0.98))] px-4 py-3 text-sm text-amber-50 shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <p className="leading-6">{notice}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleOpenChat}
        disabled={loading}
        aria-label="Live Chat"
        aria-expanded={open}
        className={`
          group relative flex h-[3.75rem] w-[3.75rem] items-center justify-center overflow-hidden rounded-full border text-[var(--dashboard-accent-text)] shadow-[0_18px_44px_rgba(7,12,22,0.3)]
          transition-all duration-300 ease-out active:translate-y-0
          backdrop-blur-xl disabled:cursor-not-allowed disabled:opacity-80
          ${open
            ? "border-[rgba(194,235,45,0.7)] bg-[linear-gradient(180deg,var(--dashboard-accent-strong),var(--dashboard-accent))] shadow-[0_16px_34px_rgba(194,235,45,0.34)]"
            : "border-[rgba(194,235,45,0.62)] bg-[linear-gradient(180deg,var(--dashboard-accent-strong),var(--dashboard-accent))] shadow-[0_16px_34px_rgba(194,235,45,0.3)]"
          }
        `}
      >
        {!loading && (
          <>
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_52%)] opacity-80" />
            <span className="absolute -right-3 -top-3 h-14 w-14 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
            <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
          </>
        )}

        <span className="relative flex h-full w-full items-center justify-center">
          {!open && !loading && (
            <>
              <span className="absolute h-10 w-10 animate-ping rounded-full bg-[rgba(194,235,45,0.18)]" />
              <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-[rgba(28,39,10,0.85)] bg-[#d7f56b]" />
            </>
          )}
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : open ? (
            <X className="h-4 w-4" />
          ) : (
            <Headset className="h-6 w-6 drop-shadow-[0_3px_8px_rgba(0,0,0,0.22)]" />
          )}
        </span>
      </motion.button>
    </div>
    ,
    document.body
  );
}
