"use client";

import React from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useUserNotifications } from "@/components/UserNotificationsProvider";

export default function UserNotificationsBar() {
  const { notifications, unseenCount, isMarkingSeen, markAllSeen } = useUserNotifications();

  if (unseenCount <= 0) {
    return null;
  }

  const latestNotification = notifications.find((item) => !item.isSeen) || notifications[0];
  if (!latestNotification) {
    return null;
  }

  return (
    <div className="px-4 pb-1 pt-3 sm:px-4 lg:px-0">
      <div className="dashboard-panel flex flex-col gap-4 rounded-[24px] px-4 py-4 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="dashboard-accent-surface flex h-11 w-11 flex-none items-center justify-center rounded-2xl">
            <Bell size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="dashboard-text-strong text-sm font-black sm:text-base">{latestNotification.title}</p>
              <span className="dashboard-chip px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
                {unseenCount} New
              </span>
            </div>
            <p className="dashboard-text-muted mt-1 text-xs leading-6 sm:text-sm">
              {latestNotification.message}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={markAllSeen}
          disabled={isMarkingSeen}
          className="dashboard-accent-surface inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70"
        >
          <CheckCheck size={16} />
          {isMarkingSeen ? "Updating..." : "Mark As Seen"}
        </button>
      </div>
    </div>
  );
}
