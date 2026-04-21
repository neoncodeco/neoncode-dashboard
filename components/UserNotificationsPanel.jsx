"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  CheckCheck,
  Inbox,
  LifeBuoy,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

const panelTabs = [
  { id: "unread", label: "Unread" },
  { id: "all", label: "All" },
];

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: "easeOut",
    },
  },
};

function formatRelativeTime(value) {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 1) return "Just now";
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function resolveNotificationMeta(item) {
  const text = `${item?.title || ""} ${item?.message || ""}`.toLowerCase();

  if (text.includes("payment") || text.includes("wallet") || text.includes("billing") || text.includes("top up")) {
    return {
      icon: Wallet,
      label: "Billing",
      iconClassName: "text-emerald-700",
      accentClassName: "border-emerald-200/70 bg-[linear-gradient(135deg,rgba(183,223,105,0.28),rgba(240,253,244,0.96)_48%,rgba(255,255,255,0.98))]",
      chipClassName: "bg-emerald-100 text-emerald-700",
    };
  }

  if (text.includes("support") || text.includes("ticket") || text.includes("reply")) {
    return {
      icon: LifeBuoy,
      label: "Support",
      iconClassName: "text-sky-700",
      accentClassName: "border-sky-200/70 bg-[linear-gradient(135deg,rgba(125,211,252,0.28),rgba(239,246,255,0.96)_48%,rgba(255,255,255,0.98))]",
      chipClassName: "bg-sky-100 text-sky-700",
    };
  }

  if (text.includes("security") || text.includes("account") || text.includes("verification")) {
    return {
      icon: ShieldCheck,
      label: "Account",
      iconClassName: "text-violet-700",
      accentClassName: "border-violet-200/70 bg-[linear-gradient(135deg,rgba(196,181,253,0.3),rgba(245,243,255,0.96)_48%,rgba(255,255,255,0.98))]",
      chipClassName: "bg-violet-100 text-violet-700",
    };
  }

  return {
    icon: Megaphone,
    label: "Update",
    iconClassName: "text-amber-700",
    accentClassName: "border-amber-200/70 bg-[linear-gradient(135deg,rgba(253,224,71,0.26),rgba(255,251,235,0.96)_48%,rgba(255,255,255,0.98))]",
    chipClassName: "bg-amber-100 text-amber-700",
  };
}

function NotificationSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.45, 0.8, 0.45] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: index * 0.12 }}
          className="rounded-[24px] border border-white/60 bg-white/80 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-200/80" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-28 rounded-full bg-slate-200/80" />
              <div className="h-3.5 w-full rounded-full bg-slate-200/70" />
              <div className="h-3.5 w-3/4 rounded-full bg-slate-200/60" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ mode, error, onRefresh }) {
  const isError = Boolean(error);

  return (
    <div className="rounded-[24px] border border-dashed border-[var(--dashboard-frame-border)] bg-white/70 px-5 py-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,rgba(155,196,79,0.18),rgba(255,255,255,0.96))]">
        {isError ? <ShieldCheck className="dashboard-text-strong" size={22} /> : <Inbox className="dashboard-text-strong" size={22} />}
      </div>
      <p className="dashboard-text-strong mt-4 text-sm font-black">
        {isError
          ? "Could not load notifications"
          : mode === "unread"
            ? "No unread notifications"
            : "No notifications yet"}
      </p>
      <p className="dashboard-text-muted mt-1 text-xs leading-6">
        {isError
          ? error
          : mode === "unread"
            ? "You are all caught up for now."
            : "New platform-wide updates from admin will appear here."}
      </p>
      {isError ? (
        <button
          type="button"
          onClick={() => onRefresh({ silent: false })}
          className="dashboard-accent-surface mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold"
        >
          <RefreshCw size={15} />
          Retry
        </button>
      ) : null}
    </div>
  );
}

export default function UserNotificationsPanel({
  notifications,
  unseenCount,
  loading,
  error,
  lastUpdatedAt,
  isMarkingSeen,
  onRefresh,
  onMarkAllSeen,
  className = "",
}) {
  const [activeTab, setActiveTab] = React.useState(unseenCount > 0 ? "unread" : "all");
  const tabPillLayoutId = React.useId();
  const safeNotifications = React.useMemo(
    () => (Array.isArray(notifications) ? notifications : []),
    [notifications]
  );

  React.useEffect(() => {
    if (unseenCount <= 0 && activeTab === "unread") {
      setActiveTab("all");
    }
  }, [activeTab, unseenCount]);

  const filteredNotifications = React.useMemo(() => {
    if (activeTab === "unread") {
      return safeNotifications.filter((item) => !item.isSeen);
    }
    return safeNotifications;
  }, [activeTab, safeNotifications]);

  return (
    <div
      className={`dashboard-app-frame relative overflow-hidden rounded-[30px] border border-[var(--dashboard-frame-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,250,240,0.96))] p-3 shadow-[0_24px_55px_rgba(15,23,42,0.18)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-4 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(183,223,105,0.28),transparent_72%)]" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[20px] border border-white/70 bg-[linear-gradient(135deg,rgba(183,223,105,0.32),rgba(255,255,255,0.96))] shadow-[0_12px_24px_rgba(155,196,79,0.18)]">
              <BellRing className="dashboard-text-strong" size={19} />
            </div>
            <div className="min-w-0">
              <p className="dashboard-text-strong text-sm font-black">Notifications</p>
              <p className="dashboard-text-muted mt-1 text-xs leading-5">
                {unseenCount > 0
                  ? `${unseenCount} unread update${unseenCount > 1 ? "s" : ""}`
                  : "Everything is up to date"}
              </p>
              <p className="dashboard-text-faint mt-1 text-[10px] font-bold uppercase tracking-[0.16em]">
                Synced {formatRelativeTime(lastUpdatedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRefresh({ silent: false })}
              disabled={loading}
              className="dashboard-subpanel inline-flex h-10 w-10 items-center justify-center rounded-2xl disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Refresh notifications"
            >
              <motion.span
                animate={loading ? { rotate: 360 } : { rotate: 0 }}
                transition={loading ? { duration: 0.9, repeat: Number.POSITIVE_INFINITY, ease: "linear" } : { duration: 0.2 }}
              >
                <RefreshCw size={16} className="dashboard-text-muted" />
              </motion.span>
            </button>

            <button
              type="button"
              onClick={onMarkAllSeen}
              disabled={isMarkingSeen || unseenCount <= 0}
              className="dashboard-accent-surface inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck size={15} />
              {isMarkingSeen ? "Updating..." : "Mark all read"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-[var(--dashboard-frame-border)] bg-white/70 p-1">
          <div className="grid grid-cols-2 gap-1">
            {panelTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tab.id === "unread" ? unseenCount : safeNotifications.length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="relative overflow-hidden rounded-[18px] px-3 py-2.5 text-left"
                >
                  {isActive ? (
                    <motion.span
                      layoutId={tabPillLayoutId}
                      className="absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,rgba(183,223,105,0.45),rgba(255,255,255,0.95))] shadow-[0_10px_24px_rgba(155,196,79,0.18)]"
                    />
                  ) : null}
                  <span className="relative flex items-center justify-between gap-2">
                    <span className={`text-xs font-black ${isActive ? "dashboard-text-strong" : "dashboard-text-muted"}`}>
                      {tab.label}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black ${
                        isActive ? "bg-white/85 text-slate-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 max-h-[380px] overflow-y-auto pr-1">
          {loading && safeNotifications.length === 0 ? <NotificationSkeleton /> : null}

          {!loading && filteredNotifications.length === 0 ? (
            <EmptyState mode={activeTab} error={error} onRefresh={onRefresh} />
          ) : null}

          {!loading && filteredNotifications.length > 0 ? (
            <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-2.5">
              <AnimatePresence initial={false} mode="popLayout">
                {filteredNotifications.map((item) => {
                  const meta = resolveNotificationMeta(item);
                  const Icon = meta.icon;

                  return (
                    <motion.article
                      key={item.id}
                      layout
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
                      className={`relative overflow-hidden rounded-[24px] border px-4 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${
                        item.isSeen
                          ? "border-white/70 bg-white/88"
                          : meta.accentClassName
                      }`}
                    >
                      {!item.isSeen ? (
                        <motion.span
                          className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[var(--dashboard-accent)]"
                          animate={{ scale: [1, 1.22, 1] }}
                          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
                        />
                      ) : null}

                      <div className="flex items-start gap-3">
                        <div className="dashboard-subpanel flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-white/80 bg-white/80 shadow-[0_10px_18px_rgba(255,255,255,0.5)]">
                          <Icon size={17} className={meta.iconClassName} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 pr-4">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${meta.chipClassName}`}>
                              {meta.label}
                            </span>
                            {!item.isSeen ? (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white"
                              >
                                New
                              </motion.span>
                            ) : null}
                            <span className="dashboard-text-faint text-[10px] font-bold uppercase tracking-[0.14em]">
                              {formatRelativeTime(item.publishedAt || item.createdAt)}
                            </span>
                          </div>

                          <p className="dashboard-text-strong mt-2 text-sm font-black leading-6">
                            {item.title || "Platform Update"}
                          </p>

                          <p className="dashboard-text-muted mt-1 text-xs leading-6">
                            {item.message || "A new update is available in your dashboard."}
                          </p>

                          <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] dashboard-text-faint">
                            <Sparkles size={12} />
                            <span>{item.createdBy?.name || "Neon Code Team"}</span>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
