"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, CreditCard, LifeBuoy, LogOut, Menu, Search, Settings, Share2, UserRound, Headset, History } from "lucide-react";
import DashboardThemeToggle from "@/components/DashboardThemeToggle";
import { useUserNotifications } from "@/components/UserNotificationsProvider";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { userDashboardMenuItems } from "@/lib/userDashboardNav";

function formatNotificationTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function UserDashboardTopbar({ theme, toggleTheme }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userData, logout } = useFirebaseAuth();
  const { notifications, unseenCount, isMarkingSeen, markAllSeen } = useUserNotifications();
  const [query, setQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [profileSectionOpen, setProfileSectionOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const profileMenuRef = React.useRef(null);
  const notificationsRef = React.useRef(null);
  const profileName = user?.displayName || userData?.name || "Neon Client";
  const profileId = userData?.referralCode || userData?.userId?.slice(-6) || "585D93";
  const isProfileSectionActive =
    pathname === "/user-dashboard/profile" ||
    pathname === "/user-dashboard/support" ||
    pathname === "/user-dashboard/affiliate";
  const isProfileSectionVisible = profileSectionOpen || isProfileSectionActive;
  const initials = profileName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const quickLinks = React.useMemo(
    () => [
      ...userDashboardMenuItems,
      {
        name: "Top Up Wallet",
        href: "/user-dashboard/payment-methods",
        keywords: ["top up", "topup", "wallet", "payment", "add money"],
      },
    ],
    []
  );

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

  const mobileDrawerItems = React.useMemo(
    () => [
      ...userDashboardMenuItems
        .filter((item) => !["Support Tickets", "Affiliate"].includes(item.name))
        .map((item) => ({
          label: item.name,
          href: item.href,
          icon: item.icon,
        })),
    ],
    []
  );
  const profileMenuItems = React.useMemo(
    () => [
      { label: "History", href: "/user-dashboard/history", icon: History },
      { label: "Live Chat", href: "/user-dashboard/profile?panel=chat", icon: Headset },
      { label: "Support Tickets", href: "/user-dashboard/support", icon: LifeBuoy },
      { label: "Affiliate", href: "/user-dashboard/affiliate", icon: Share2 },
      { label: "Settings", href: "/user-dashboard/profile", icon: Settings },
    ],
    []
  );

  const openTarget = React.useCallback(
    (href) => {
      setQuery("");
      setIsFocused(false);
      setProfileMenuOpen(false);
      router.push(href);
    },
    [router]
  );

  React.useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [profileMenuOpen]);

  React.useEffect(() => {
    if (!notificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [notificationsOpen]);

  React.useEffect(() => {
    if (notificationsOpen && unseenCount > 0) {
      markAllSeen();
    }
  }, [markAllSeen, notificationsOpen, unseenCount]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await logout("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && results[0]?.href) {
      event.preventDefault();
      openTarget(results[0].href);
    }
  };

  return (
    <div className="sticky top-0 z-30 px-3 pt-1.5 sm:px-4 sm:pt-3">
      <div className="dashboard-panel hidden items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 lg:flex lg:flex-row lg:items-center lg:justify-between lg:px-5">
      


        <div className="relative min-w-0 flex-1 lg:max-w-[52%]">
        

          {isFocused && query.trim() ? (
            <div className="dashboard-subpanel absolute left-0 top-[calc(100%+0.6rem)] z-20 w-full overflow-hidden rounded-[20px] p-2 sm:w-[360px] lg:left-auto lg:right-0">
              {results.length ? (
                <div className="space-y-1">
                  {results.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <button
                        key={`${item.name}-${item.href}`}
                        type="button"
                        onMouseDown={() => openTarget(item.href)}
                        className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
                          isActive ? "dashboard-accent-surface" : "dashboard-subpanel"
                        }`}
                      >
                        <div>
                          <p className="dashboard-text-strong text-sm font-bold">{item.name}</p>
                          <p className="dashboard-text-muted text-[11px]">{item.href.replace("/user-dashboard/", "")}</p>
                        </div>
                        <span className="dashboard-text-faint text-[10px] font-bold uppercase tracking-[0.14em]">
                          Open
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-4">
                  <p className="dashboard-text-strong text-sm font-bold">No matching page</p>
                  <p className="dashboard-text-muted mt-1 text-xs">Try exact words like payment, support, profile, history, or overview.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="hidden flex-wrap items-center gap-2 lg:flex lg:justify-end">
          <button
            type="button"
            onClick={() => router.push("/user-dashboard/payment-methods")}
            className="dashboard-accent-surface inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold"
          >
            <CreditCard size={16} />
            Top Up
          </button>

          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="dashboard-subpanel relative flex h-11 w-11 items-center justify-center rounded-2xl dashboard-text-muted"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unseenCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {unseenCount > 9 ? "9+" : unseenCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="dashboard-app-frame absolute right-0 top-[calc(100%+0.65rem)] z-30 w-[360px] rounded-[26px] p-3">
                <div className="flex items-center justify-between gap-3 px-2 py-1">
                  <div>
                    <p className="dashboard-text-strong text-sm font-black">Notifications</p>
                    <p className="dashboard-text-muted text-[11px]">
                      {unseenCount > 0 ? `${unseenCount} unread update${unseenCount > 1 ? "s" : ""}` : "All caught up"}
                    </p>
                  </div>
                  {notifications.length ? (
                    <button
                      type="button"
                      onClick={markAllSeen}
                      disabled={isMarkingSeen || unseenCount <= 0}
                      className="dashboard-muted-button rounded-xl px-3 py-2 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isMarkingSeen ? "Updating..." : "Mark read"}
                    </button>
                  ) : null}
                </div>

                <div className="mt-2 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                  {notifications.length ? (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border px-3 py-3 ${
                          item.isSeen
                            ? "border-transparent dashboard-subpanel"
                            : "border-sky-400/30 bg-sky-500/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="dashboard-text-strong text-sm font-bold">{item.title}</p>
                          {!item.isSeen ? (
                            <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                              New
                            </span>
                          ) : null}
                        </div>
                        <p className="dashboard-text-muted mt-1 text-xs leading-6">{item.message}</p>
                        <p className="dashboard-text-faint mt-2 text-[10px] font-bold uppercase tracking-[0.14em]">
                          {formatNotificationTime(item.publishedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="dashboard-subpanel rounded-2xl px-4 py-5">
                      <p className="dashboard-text-strong text-sm font-bold">No notifications yet</p>
                      <p className="dashboard-text-muted mt-1 text-xs">Admin announcements will show up here for every user.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <DashboardThemeToggle
            theme={theme}
            toggleTheme={toggleTheme}
            compact
            className="text-xs"
          />

          <div className="dashboard-subpanel flex flex-none items-center gap-2 rounded-2xl px-3 py-2.5">
            <span className="dashboard-chip px-2.5 py-1 text-xs font-bold">ID {profileId}</span>
            <button
              type="button"
              onClick={() => router.push("/user-dashboard/profile")}
              className="dashboard-muted-button inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold"
            >
              <UserRound size={14} />
              Profile
            </button>
            <button
              type="button"
              onClick={() => router.push("/user-dashboard/profile")}
              className="dashboard-accent-surface flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-black"
              aria-label="Open profile"
            >
              {initials}
            </button>
          </div>
        </div>

      </div>

      <div ref={profileMenuRef} className="relative mt-2 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="dashboard-app-frame sidebar-shell flex h-12 w-12 items-center justify-center rounded-[20px]"
            aria-label="Open dashboard menu"
          >
            <span className="dashboard-accent-surface flex h-9 w-9 items-center justify-center rounded-2xl">
              <Menu size={18} />
            </span>
          </button>

          <DashboardThemeToggle
            theme={theme}
            toggleTheme={toggleTheme}
            iconOnly
            className="dashboard-app-frame sidebar-shell h-12 w-12 rounded-[20px] border-0"
          />
        </div>

        {profileMenuOpen ? (
          <div className="dashboard-app-frame absolute left-0 top-[calc(100%+0.55rem)] z-30 w-[min(22rem,calc(100vw-2rem))] rounded-[28px] p-3">
            <button
              type="button"
              onClick={() => openTarget("/user-dashboard/overview")}
              className="dashboard-subpanel flex w-full items-center gap-3 p-3 text-left transition hover:bg-[var(--sidebar-link-hover-bg)]"
            >
              <div className="dashboard-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-black">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="dashboard-text-strong truncate text-sm font-bold">{profileName}</p>
                <p className="dashboard-text-muted truncate text-[11px]">ID {profileId}</p>
              </div>
            </button>

            <div className="mt-3 space-y-1.5">
              {mobileDrawerItems.map((item) => (
                <React.Fragment key={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.label === "Profile") {
                        setProfileSectionOpen(!isProfileSectionVisible);
                        return;
                      }
                      openTarget(item.href);
                    }}
                    className={`dashboard-subpanel flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left ${
                      pathname === item.href || (item.label === "Profile" && isProfileSectionActive) ? "sidebar-active" : ""
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="dashboard-subpanel flex h-8 w-8 items-center justify-center rounded-xl">
                        <item.icon size={15} className="dashboard-text-muted" />
                      </span>
                      <span className="dashboard-text-strong text-sm font-semibold">{item.label}</span>
                    </span>
                    <ChevronRight size={15} className="dashboard-text-faint" />
                  </button>

                  {item.label === "Profile" && isProfileSectionVisible ? (
                    <div className="ml-4 space-y-1.5 border-l border-[var(--dashboard-frame-border)] pl-3">
                      {profileMenuItems.map((subItem) => (
                        <button
                          key={subItem.label}
                          type="button"
                          onClick={() => openTarget(subItem.href)}
                          className="dashboard-subpanel flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left"
                        >
                          <span className="flex items-center gap-3">
                            <span className="dashboard-subpanel flex h-8 w-8 items-center justify-center rounded-xl">
                              <subItem.icon size={15} className="dashboard-text-muted" />
                            </span>
                            <span className="dashboard-text-strong text-sm font-semibold">{subItem.label}</span>
                          </span>
                          <ChevronRight size={15} className="dashboard-text-faint" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </React.Fragment>
              ))}

              <button
                type="button"
                onClick={handleLogout}
                className="dashboard-subpanel flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-red-400"
              >
                <span className="dashboard-subpanel flex h-8 w-8 items-center justify-center rounded-xl">
                  <LogOut size={15} className="text-red-400" />
                </span>
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
