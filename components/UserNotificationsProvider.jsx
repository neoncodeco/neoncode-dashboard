"use client";

import React from "react";

const UserNotificationsContext = React.createContext(null);

export function UserNotificationsProvider({ children }) {
  const [notifications, setNotifications] = React.useState([]);
  const [unseenCount, setUnseenCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [isMarkingSeen, setIsMarkingSeen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState(null);
  const latestRequestRef = React.useRef(0);
  const visibleLoadCountRef = React.useRef(0);

  const loadNotifications = React.useCallback(async ({ silent = false, signal } = {}) => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    if (!silent) {
      visibleLoadCountRef.current += 1;
      setLoading(true);
    }

    try {
      const res = await fetch("/api/notifications?limit=20", {
        cache: "no-store",
        signal,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load notifications");
      }

      if (latestRequestRef.current !== requestId) {
        return;
      }

      setError("");
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnseenCount(Number(data.unseenCount) || 0);
      setLastUpdatedAt(data?.fetchedAt || new Date().toISOString());
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      if (latestRequestRef.current !== requestId) {
        return;
      }

      console.error("LOAD NOTIFICATIONS ERROR:", error);
      setError(error?.message || "Could not load notifications.");
    } finally {
      if (!silent) {
        visibleLoadCountRef.current = Math.max(visibleLoadCountRef.current - 1, 0);
        if (visibleLoadCountRef.current === 0) {
          setLoading(false);
        }
      }
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    const refreshSilently = () => loadNotifications({ silent: true });

    loadNotifications({ signal: controller.signal });

    const interval = window.setInterval(() => {
      refreshSilently();
    }, 45000);

    const handleWindowFocus = () => {
      refreshSilently();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshSilently();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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

      setError("");
      setUnseenCount(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, isSeen: true })));
      setLastUpdatedAt(data?.seenAt || new Date().toISOString());
    } catch (error) {
      console.error("MARK SEEN ERROR:", error);
      setError(error?.message || "Could not update notifications.");
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
      error,
      lastUpdatedAt,
      loadNotifications,
      markAllSeen,
    }),
    [notifications, unseenCount, loading, isMarkingSeen, error, lastUpdatedAt, loadNotifications, markAllSeen]
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
