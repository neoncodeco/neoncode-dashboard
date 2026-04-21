"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, CheckCheck, ChevronRight } from "lucide-react";
import { useUserNotifications } from "@/components/UserNotificationsProvider";

function formatNotificationTime(value) {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function UserNotificationsBar() {
  const { notifications, unseenCount, loading, isMarkingSeen, markAllSeen } = useUserNotifications();
  const latestNotification = notifications.find((item) => !item.isSeen) || notifications[0] || null;

  const openNotificationCenter = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-user-notifications"));
    }
  };

  return (
    <AnimatePresence initial={false}>
      {unseenCount > 0 && latestNotification ? (
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="px-4 pb-1 pt-3 sm:px-4 lg:px-0"
        >
          <div className="dashboard-panel relative overflow-hidden rounded-[28px] border px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.1)] sm:px-5 lg:px-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,rgba(183,223,105,0.32),transparent_58%)]" />

            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3.5">
                <motion.div
                  initial={{ scale: 0.92, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-[20px] border border-white/70 bg-[linear-gradient(135deg,rgba(183,223,105,0.35),rgba(255,255,255,0.96))] shadow-[0_16px_30px_rgba(155,196,79,0.18)]"
                >
                  <BellRing className="dashboard-text-strong" size={19} />
                </motion.div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                      {unseenCount} New
                    </span>
                    <span className="dashboard-text-faint text-[10px] font-bold uppercase tracking-[0.16em]">
                      {formatNotificationTime(latestNotification.publishedAt || latestNotification.createdAt)}
                    </span>
                  </div>

                  <p className="dashboard-text-strong mt-2 text-sm font-black sm:text-base">
                    {latestNotification.title}
                  </p>
                  <p className="dashboard-text-muted mt-1 max-w-3xl text-xs leading-6 sm:text-sm">
                    {latestNotification.message}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={openNotificationCenter}
                  disabled={loading}
                  className="dashboard-subpanel inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Review Updates
                  <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={markAllSeen}
                  disabled={isMarkingSeen}
                  className="dashboard-accent-surface inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <CheckCheck size={16} />
                  {isMarkingSeen ? "Updating..." : "Mark All Read"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
