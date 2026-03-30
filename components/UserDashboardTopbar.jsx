"use client";

import React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, CreditCard, LifeBuoy, LogOut, Search, Settings, Share2, UserRound } from "lucide-react";
import DashboardThemeToggle from "@/components/DashboardThemeToggle";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { userDashboardMenuItems } from "@/lib/userDashboardNav";

export default function UserDashboardTopbar({ theme, toggleTheme }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userData, logout } = useFirebaseAuth();
  const [query, setQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const profileMenuRef = React.useRef(null);
  const profileName = user?.displayName || userData?.name || "Neon Client";
  const profileId = userData?.referralCode || userData?.userId?.slice(-6) || "585D93";
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
    <div className="sticky top-0 z-30 hidden px-3 pt-1.5 sm:px-4 sm:pt-3 lg:block">
      <div className="dashboard-panel flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <button
          type="button"
          onClick={() => router.push("/user-dashboard/overview")}
          className="dashboard-subpanel flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl p-2 lg:hidden"
          aria-label="Go to overview"
        >
          <Image src="/Neon Studio icon.png" alt="Neon Code" width={22} height={22} />
        </button>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={() => router.push("/user-dashboard/overview")}
            className="dashboard-subpanel flex h-11 w-11 items-center justify-center rounded-2xl p-2"
            aria-label="Go to overview"
          >
            <Image src="/Neon Studio icon.png" alt="Neon Code" width={24} height={24} />
          </button>
          <div>
            <p className="dashboard-text-strong text-base font-semibold">Neon Code</p>
            <p className="dashboard-text-faint text-[10px] uppercase tracking-[0.24em]">Client Dashboard</p>
          </div>
        </div>

        <div className="relative min-w-0 flex-1 lg:max-w-[52%]">
          <div className="dashboard-search flex items-center gap-3 rounded-2xl px-4 py-3.5">
            <Search size={19} className="dashboard-text-faint" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
              onKeyDown={handleKeyDown}
              aria-label="Search dashboard pages"
              placeholder="Search pages, support, payment, profile..."
              className="w-full min-w-0 text-[15px]"
            />
          </div>

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

          <button
            type="button"
            className="dashboard-subpanel flex h-11 w-11 items-center justify-center rounded-2xl dashboard-text-muted"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

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

        <div ref={profileMenuRef} className="relative lg:hidden">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="dashboard-accent-surface flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black"
            aria-label="Open profile menu"
          >
            {initials}
          </button>

          {profileMenuOpen ? (
            <div className="dashboard-app-frame absolute right-0 top-[calc(100%+0.55rem)] w-64 rounded-[24px] p-3">
              <div className="dashboard-subpanel flex items-center gap-3 p-3">
                <div className="dashboard-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-black">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="dashboard-text-strong truncate text-sm font-bold">{profileName}</p>
                  <p className="dashboard-text-muted truncate text-[11px]">ID {profileId}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {[
                  { label: "Profile", href: "/user-dashboard/profile", icon: UserRound },
                  { label: "Settings", href: "/user-dashboard/profile", icon: Settings },
                  { label: "Affiliate", href: "/user-dashboard/affiliate", icon: Share2 },
                  { label: "Support Tickets", href: "/user-dashboard/support", icon: LifeBuoy },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => openTarget(item.href)}
                    className="dashboard-subpanel flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span className="dashboard-subpanel flex h-8 w-8 items-center justify-center rounded-xl">
                        <item.icon size={15} className="dashboard-text-muted" />
                      </span>
                      <span className="dashboard-text-strong text-sm font-semibold">{item.label}</span>
                    </span>
                    <ChevronRight size={15} className="dashboard-text-faint" />
                  </button>
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
    </div>
  );
}
