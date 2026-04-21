"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Sora } from "next/font/google";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CreditCard, Search, X } from "lucide-react";
// import DashboardThemeToggle from "@/components/DashboardThemeToggle";
import UserNotificationsPanel from "@/components/UserNotificationsPanel";
import { useUserNotifications } from "@/components/UserNotificationsProvider";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { userDashboardMenuItems } from "@/lib/userDashboardNav";
import { userDashboardRoutes } from "@/lib/userDashboardRoutes";

const brandFont = Sora({
  subsets: ["latin"],
  weight: ["800"],
});

export default function UserDashboardTopbar({ theme, toggleTheme }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userData } = useFirebaseAuth();
  const {
    notifications,
    unseenCount,
    loading: notificationsLoading,
    error: notificationsError,
    lastUpdatedAt,
    isMarkingSeen,
    loadNotifications,
    markAllSeen,
  } = useUserNotifications();
  const [query, setQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const notificationsRef = React.useRef(null);
  const mobileNotificationsRef = React.useRef(null);
  const searchInputRef = React.useRef(null);
  const profileName = user?.displayName || userData?.name || "Neon Client";
  const initials = profileName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const quickLinks = userDashboardMenuItems;

  const results = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    return quickLinks
      .filter((item) => {
        const name = item.name.toLowerCase();
        const href = item.href.toLowerCase();
        const keywords = (item.keywords || []).map((keyword) => keyword.toLowerCase());

        return (
          name.includes(term) ||
          href.includes(term) ||
          keywords.some((keyword) => keyword.includes(term))
        );
      })
      .slice(0, 6);
  }, [query, quickLinks]);

  const isRouteActive = React.useCallback(
    (href) => {
      const normalizedHref = href.split("?")[0];
      return pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
    },
    [pathname]
  );

  const openTarget = React.useCallback(
    (href) => {
      setQuery("");
      setIsFocused(false);
      setNotificationsOpen(false);

      if (href === userDashboardRoutes.accountChat) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("open-live-chat"));
        }
        return;
      }

      router.push(href);
    },
    [router]
  );

  const openNotificationsPanel = React.useCallback(() => {
    setNotificationsOpen(true);
    loadNotifications({ silent: notifications.length > 0 });
  }, [loadNotifications, notifications.length]);

  const toggleNotificationsPanel = React.useCallback(() => {
    if (!notificationsOpen) {
      loadNotifications({ silent: notifications.length > 0 });
    }
    setNotificationsOpen((prev) => !prev);
  }, [loadNotifications, notifications.length, notificationsOpen]);

  React.useEffect(() => {
    if (!notificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        !notificationsRef.current?.contains(event.target) &&
        !mobileNotificationsRef.current?.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [notificationsOpen]);

  React.useEffect(() => {
    const handleOpenNotifications = () => {
      openNotificationsPanel();
    };

    window.addEventListener("open-user-notifications", handleOpenNotifications);
    return () => window.removeEventListener("open-user-notifications", handleOpenNotifications);
  }, [openNotificationsPanel]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && results[0]?.href) {
      event.preventDefault();
      openTarget(results[0].href);
    }
    if (event.key === "Escape") {
      setQuery("");
      setIsFocused(false);
      searchInputRef.current?.blur();
    }
  };

  return (
    <div className="sticky top-0 z-30 px-3 pt-2 sm:px-4 sm:pt-3">

      {/* ── DESKTOP TOPBAR ── */}
      <div className="topbar-shell  hidden lg:flex lg:flex-row lg:items-center lg:justify-between lg:gap-3 px-4 py-2.5">

        {/* Left: Page greeting */}
        <div className="hidden xl:flex min-w-0 flex-none items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] dashboard-text-faint leading-none mb-0.5">
              Dashboard
            </p>
            <p className="text-base font-black tracking-tight dashboard-text-strong leading-none truncate">
              Welcome back, {profileName.split(" ")[0]}
            </p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="relative mx-4" style={{ width: "320px", flexShrink: 0 }}>
          <div className="topbar-search-wrap flex items-center gap-2.5 rounded-2xl px-3 py-1.5">
            <Search size={15} className="flex-none dashboard-text-faint" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search pages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent p-1 text-sm font-medium dashboard-text-strong placeholder:dashboard-text-faint outline-none focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onMouseDown={() => { setQuery(""); searchInputRef.current?.focus(); }}
                className="flex-none dashboard-text-faint hover:dashboard-text-muted transition-colors"
              >
                <X size={13} />
              </button>
            ) : (
              <span className="topbar-kbd flex-none">⌘K</span>
            )}
          </div>

          {/* Search dropdown */}
          {isFocused && query.trim() ? (
            <div className="topbar-search-dropdown absolute left-0 top-[calc(100%+0.6rem)] z-20 w-full overflow-hidden rounded-[20px] p-2 sm:w-[360px] lg:left-auto lg:right-0">
              {results.length ? (
                <div className="space-y-1">
                  {results.map((item) => {
                    const isActive = isRouteActive(item.href);
                    return (
                      <button
                        key={`${item.name}-${item.href}`}
                        type="button"
                        onMouseDown={() => openTarget(item.href)}
                        className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
                          isActive ? "dashboard-accent-surface" : "search-result-item"
                        }`}
                      >
                        <div>
                          <p className="dashboard-text-strong text-sm font-bold">{item.name}</p>
                          <p className="dashboard-text-muted text-[11px]">{item.href.replace("/user-dashboard/", "")}</p>
                        </div>
                        <span className="topbar-open-badge">Open</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-4">
                  <p className="dashboard-text-strong text-sm font-bold">No matching page</p>
                  <p className="dashboard-text-muted mt-1 text-xs">
                    Try words like billing, support, account, activity, or dashboard.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="hidden flex-none items-center gap-2 lg:flex">

          {/* Top Up Button */}
          <button
            type="button"
            onClick={() => router.push(userDashboardRoutes.billing)}
            className="topbar-topup-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold"
          >
            <CreditCard size={15} />
            Add Funds
          </button>

          {/* Notifications */}
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={toggleNotificationsPanel}
              className={`topbar-icon-btn relative flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                notificationsOpen ? "dashboard-accent-surface" : "dashboard-text-muted"
              }`}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell size={17} />
              <AnimatePresence>
                {unseenCount > 0 ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.7, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.75, y: 4 }}
                    className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-sky-500 px-1 py-0.5 text-[9px] font-black text-white shadow-[0_10px_24px_rgba(14,165,233,0.35)]"
                  >
                    {unseenCount > 9 ? "9+" : unseenCount}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {notificationsOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-[calc(100%+0.65rem)] z-30"
                >
                  <UserNotificationsPanel
                    notifications={notifications}
                    unseenCount={unseenCount}
                    loading={notificationsLoading}
                    error={notificationsError}
                    lastUpdatedAt={lastUpdatedAt}
                    isMarkingSeen={isMarkingSeen}
                    onRefresh={loadNotifications}
                    onMarkAllSeen={markAllSeen}
                    className="w-[380px]"
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Theme toggle (temporarily disabled) */}
          {/* <DashboardThemeToggle
            theme={theme}
            toggleTheme={toggleTheme}
            compact
            className="text-xs"
          /> */}

          {/* Profile avatar only */}
          <button
            type="button"
            onClick={() => router.push(userDashboardRoutes.account)}
            className="dashboard-accent-surface flex h-10 w-10 flex-none items-center justify-center rounded-xl text-xs font-black transition hover:opacity-85"
            aria-label="Open profile"
          >
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={profileName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              initials
            )}
          </button>
        </div>
      </div>

      {/* ── MOBILE TOPBAR ── */}
      <div className="relative mt-2 lg:hidden">
        <div className="topbar-shell flex items-center justify-between gap-2 rounded-[22px] px-2 py-2">
          <Link
            href={userDashboardRoutes.dashboard}
            className="flex min-w-0 flex-1 items-center gap-2.5 px-1.5 transition hover:opacity-85"
            aria-label="Go to dashboard"
          >
            <Image src="/neon-code-logo.jpg" alt="Neon Code" width={34} height={34} className="rounded-[10px]" />
            <span className={`${brandFont.className} truncate text-[1.04rem] font-extrabold tracking-[-0.03em] dashboard-text-strong`}>
              Neon Code
            </span>
          </Link>

          <div className="flex flex-none items-center gap-1.5">
            <div ref={mobileNotificationsRef} className="relative">
              <button
                type="button"
                onClick={toggleNotificationsPanel}
                className={`relative flex h-10 w-10 items-center justify-center rounded-[16px] transition ${
                  notificationsOpen ? "dashboard-accent-surface" : "dashboard-subpanel dashboard-text-muted"
                }`}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={16} />
                <AnimatePresence>
                  {unseenCount > 0 ? (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.75, y: 4 }}
                      className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-sky-500 px-1 py-0.5 text-[9px] font-black text-white shadow-[0_10px_24px_rgba(14,165,233,0.35)]"
                    >
                      {unseenCount > 9 ? "9+" : unseenCount}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {notificationsOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-[calc(100%+0.55rem)] z-30"
                  >
                    <UserNotificationsPanel
                      notifications={notifications}
                      unseenCount={unseenCount}
                      loading={notificationsLoading}
                      error={notificationsError}
                      lastUpdatedAt={lastUpdatedAt}
                      isMarkingSeen={isMarkingSeen}
                      onRefresh={loadNotifications}
                      onMarkAllSeen={markAllSeen}
                      className="w-[min(22rem,calc(100vw-2rem))]"
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* <DashboardThemeToggle
              theme={theme}
              toggleTheme={toggleTheme}
              iconOnly
              className="h-10 w-10 rounded-[16px] dashboard-subpanel border-0"
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
}
