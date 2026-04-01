"use client";

import React from "react";

const UserNotificationsContext = React.createContext(null);

export function UserNotificationsProvider({ children }) {
  const [notifications, setNotifications] = React.useState([]);
  const [unseenCount, setUnseenCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [isMarkingSeen, setIsMarkingSeen] = React.useState(false);

  const loadNotifications = React.useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const res = await fetch("/api/notifications?limit=15", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load notifications");
      }

      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnseenCount(Number(data.unseenCount) || 0);
    } catch (error) {
      console.error("LOAD NOTIFICATIONS ERROR:", error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();

    const interval = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, 60000);

    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const markAllSeen = React.useCallback(async () => {
    if (isMarkingSeen || unseenCount <= 0) return;
    setIsMarkingSeen(true);

    try {
      const res = await fetch("/api/notifications/mark-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to mark notifications as seen");
      }

      setUnseenCount(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, isSeen: true })));
    } catch (error) {
      console.error("MARK SEEN ERROR:", error);
    } finally {
      setIsMarkingSeen(false);
    }
  }, [isMarkingSeen, unseenCount]);

  const value = React.useMemo(
    () => ({
      notifications,
      unseenCount,
      loading,
      isMarkingSeen,
      loadNotifications,
      markAllSeen,
    }),
    [notifications, unseenCount, loading, isMarkingSeen, loadNotifications, markAllSeen]
  );

  return <UserNotificationsContext.Provider value={value}>{children}</UserNotificationsContext.Provider>;
}

export function useUserNotifications() {
  const context = React.useContext(UserNotificationsContext);
  if (!context) {
    throw new Error("useUserNotifications must be used within UserNotificationsProvider");
  }
  return context;
}
