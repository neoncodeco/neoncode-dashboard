"use client";

import React, { useEffect, useMemo, useState } from "react"; // useMemo kept for UserIdentity
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  CircleHelp,
  CreditCard,
  Ellipsis,
  Headset,
  Home,
  LayoutDashboard,
  LogOut,
  Layers3,
  LifeBuoy,
  Share2,
  WalletCards,
  History,
} from "lucide-react";
import DashboardThemeToggle from "@/components/DashboardThemeToggle";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { userDashboardMenuItems } from "@/lib/userDashboardNav";

const mobileTabs = [
  { name: "Home", icon: Home, href: "/user-dashboard/overview", tooltip: "Overview" },
  { name: "Services", icon: Layers3, href: "/user-dashboard/services", tooltip: "Our Services" },
  { name: "Meta Ads", icon: WalletCards, href: "/user-dashboard/meta-ads-account", tooltip: "Meta Ads Account" },
  { name: "History", icon: History, href: "/user-dashboard/history", tooltip: "Activity History" },
  { name: "More", icon: Ellipsis, href: "#more", tooltip: "More Menu" },
];

const profileSubItems = [

  { name: "Support Tickets", href: "/user-dashboard/support", icon: LifeBuoy },
  { name: "History", href: "/user-dashboard/history", icon: History },
  { name: "Affiliate", href: "/user-dashboard/affiliate", icon: Share2 },
  { name: "Settings", href: "/user-dashboard/profile", icon: CircleHelp },
];

function UserIdentity({ user, href = "/user-dashboard/overview" }) {

  const initials = useMemo(() => {
    const base = user?.displayName || user?.email || "NC";
    return base
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  return (
    <Link href={href} className="dashboard-subpanel flex items-center gap-3 p-3 transition hover:bg-[var(--sidebar-link-hover-bg)]">
      {user?.photoURL ? (
        <Image
          src={user.photoURL}
          alt={user.displayName || "User"}
          width={42}
          height={42}
          className="h-10 w-10 rounded-2xl object-cover"
        />
      ) : (
        <div className="dashboard-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black">
          {initials}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold dashboard-text-strong">
          {user?.displayName || "Neon Client"}
        </p>
        <p className="truncate text-xs dashboard-text-muted">
          {user?.email || "Premium Tier"}
        </p>
      </div>
    </Link>
  );
}

const UserSidebar = ({ theme, toggleTheme }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, logout } = useFirebaseAuth();
  const portalRoot = typeof document !== "undefined" ? document.body : null;
  useEffect(() => {
    if (!servicesMenuOpen && !profileMenuOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setServicesMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [servicesMenuOpen, profileMenuOpen]);

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

  const mainNavItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/user-dashboard/overview" },
    { name: "Our Services", icon: Layers3, href: "/user-dashboard/services" },
    { name: "Meta Ads Account", icon: WalletCards, href: "/user-dashboard/meta-ads-account" },
    { name: "Billing", icon: CreditCard, href: "/user-dashboard/payment-methods" },
  ];

  const accountNavItems = [
    { name: "Support Tickets", icon: LifeBuoy, href: "/user-dashboard/support" },
    { name: "Affiliate", icon: Share2, href: "/user-dashboard/affiliate" },
    { name: "Profile & Settings", icon: CircleHelp, href: "/user-dashboard/profile" },
    { name: "Activity History", icon: History, href: "/user-dashboard/history" },
  ];

  const isRouteActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const renderNavItem = (item) => {
    const isActive = isRouteActive(item.href);
    return (
      <Link
        key={item.name}
        href={item.href}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
          isActive
            ? "sidebar-active border shadow-[0_4px_16px_rgba(183,223,105,0.08)]"
            : "sidebar-link border border-transparent hover:border-[var(--dashboard-frame-border)]"
        }`}
      >
        <span className={`sidebar-icon flex h-7 w-7 flex-none items-center justify-center rounded-lg transition-all ${
          isActive ? "sidebar-icon-active dashboard-accent-surface" : "sidebar-icon-idle bg-[var(--dashboard-frame-border)]/40"
        }`}>
          <item.icon size={14} />
        </span>
        <span className={`sidebar-label truncate text-sm font-semibold ${isActive ? "sidebar-label-active" : "sidebar-label-idle"}`}>
          {item.name}
        </span>
      </Link>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex-none pb-5">
        <Link
          href="/user-dashboard/overview"
          className="flex items-center gap-3 rounded-2xl px-1 py-1 transition hover:opacity-80"
        >
          <span className="dashboard-accent-surface flex h-10 w-10 flex-none items-center justify-center rounded-xl p-2">
            <Image src="/neon-code-logo.jpg" alt="Logo" width={24} height={24} className="rounded-md" />
          </span>
          <div>
            <p className="text-base font-black tracking-tight dashboard-text-strong">Neon Code</p>
            <p className="text-[10px] uppercase tracking-[0.22em] dashboard-text-faint">User Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Navigation — flex-1 fills remaining height, inner panel has background */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full flex-col overflow-y-auto  p-3">
          <div className="space-y-5">
            <div>
              <p className="sidebar-section-title mb-1.5 px-2 text-[10px] font-black uppercase tracking-[0.2em] dashboard-text-faint">Main</p>
              <nav className="space-y-0.5">
                {mainNavItems.map(renderNavItem)}
              </nav>
            </div>

            <div>
              <p className="sidebar-section-title mb-1.5 px-2 text-[10px] font-black uppercase tracking-[0.2em] dashboard-text-faint">Account</p>
              <nav className="space-y-0.5">
                {accountNavItems.map(renderNavItem)}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none space-y-2 border-t pt-4" style={{ borderColor: "var(--dashboard-frame-border)" }}>
        <UserIdentity user={user} href="/user-dashboard/profile" />
        <div className="flex items-center gap-2">
          <DashboardThemeToggle
            theme={theme}
            toggleTheme={toggleTheme}
            iconOnly
            className="h-10 w-10 flex-none rounded-xl border-0 dashboard-subpanel"
          />
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="dashboard-subpanel flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold dashboard-text-muted transition hover:text-red-400"
            >
              <LogOut size={15} />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          ) : (
            <Link
              href="/login"
              className="dashboard-subpanel flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold dashboard-text-muted"
            >
              <LogOut size={15} />
              Login
            </Link>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:block lg:w-[300px] lg:flex-shrink-0 2xl:w-[320px]">
        <div className="sticky inset-0 h-screen overflow-hidden">
          <div className="sidebar-shell user-sidebar-shell flex h-full flex-col p-5">
            {sidebarContent}
          </div>
        </div>
      </aside>

      {portalRoot
        ? createPortal(
            <>
              {servicesMenuOpen ? (
                <div
                  className="fixed inset-x-4 z-[85] flex justify-center"
                  style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.25rem)" }}
                >
                  <div className="dashboard-app-frame sidebar-shell user-sidebar-shell w-full max-w-[21rem] overflow-hidden rounded-[30px] p-3">
                    <div className="grid gap-2">
                      {[
                        { name: "Our Services", href: "/user-dashboard/services", icon: Layers3 },
                        // { name: "Freepik Premium", href: "/user-dashboard/freepik-premium", icon: PackageOpen },
                        { name: "Premium Service", href: "/user-dashboard/services", icon: Share2 },
                      ].map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="dashboard-subpanel flex items-center gap-3 rounded-2xl px-4 py-3"
                        >
                          <span className="dashboard-accent-surface flex h-9 w-9 items-center justify-center rounded-2xl">
                            <item.icon size={16} />
                          </span>
                          <span className="dashboard-text-strong text-sm font-semibold">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {profileMenuOpen ? (
                <div
                  className="fixed inset-x-4 z-[86] flex justify-end"
                  style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.25rem)" }}
                >
                  <div className="dashboard-app-frame sidebar-shell user-sidebar-shell w-full max-w-[18.5rem] overflow-hidden rounded-[30px] p-3">
                    <div className="dashboard-subpanel flex items-center justify-center p-3">
                      {user?.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="dashboard-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black">
                          {user?.displayName?.slice(0, 1)?.toUpperCase() || "NC"}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid gap-2">
                      <DashboardThemeToggle
                        theme={theme}
                        toggleTheme={toggleTheme}
                        className="w-full justify-start rounded-2xl px-4 py-3"
                      />

                      {[
                        { name: "Wallet", href: "/user-dashboard/payment-methods", icon: CreditCard },
                        { name: "Profile", href: "/user-dashboard/profile", icon: CircleHelp },
                        { name: "History", href: "/user-dashboard/history", icon: History },
                        { name: "Live Chat", href: "/user-dashboard/profile?panel=chat", icon: Headset },
                        { name: "Affiliate", href: "/user-dashboard/affiliate", icon: Share2 },
                        { name: "Support Tickets", href: "/user-dashboard/support", icon: LifeBuoy },
                      ].map((item) => (
                        item.name === "Live Chat" ? (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false);
                              if (typeof window !== "undefined") {
                                window.dispatchEvent(new Event("open-live-chat"));
                              }
                            }}
                            className="dashboard-subpanel flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
                          >
                            <span className="dashboard-subpanel flex h-9 w-9 items-center justify-center rounded-2xl">
                              <item.icon size={16} className="dashboard-text-muted" />
                            </span>
                            <span className="dashboard-text-strong text-sm font-semibold">{item.name}</span>
                          </button>
                        ) : (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setProfileMenuOpen(false)}
                            className="dashboard-subpanel flex items-center gap-3 rounded-2xl px-4 py-3"
                          >
                            <span className="dashboard-subpanel flex h-9 w-9 items-center justify-center rounded-2xl">
                              <item.icon size={16} className="dashboard-text-muted" />
                            </span>
                            <span className="dashboard-text-strong text-sm font-semibold">{item.name}</span>
                          </Link>
                        )
                      ))}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="dashboard-subpanel flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-red-400"
                      >
                        <span className="dashboard-subpanel flex h-9 w-9 items-center justify-center rounded-2xl">
                          <LogOut size={16} className="text-red-400" />
                        </span>
                        <span className="text-sm font-semibold">{isLoggingOut ? "Logging out..." : "Logout"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <nav
                className="dashboard-app-frame sidebar-shell user-sidebar-shell fixed left-1/2 z-[70] grid lg:hidden w-[calc(100%-1.5rem)] max-w-[22rem] -translate-x-1/2 grid-cols-5 gap-1 rounded-[26px] px-2 py-2"
                style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.55rem)" }}
              >
                {mobileTabs.map((item) => {
                  const isActive = pathname === item.href;
                  const isServices = item.name === "Services";
                  const isMore = item.name === "More";

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        if (isServices) {
                          setProfileMenuOpen(false);
                          setServicesMenuOpen((prev) => !prev);
                          return;
                        }
                        if (isMore) {
                          setServicesMenuOpen(false);
                          setProfileMenuOpen((prev) => !prev);
                          return;
                        }
                        setServicesMenuOpen(false);
                        setProfileMenuOpen(false);
                        router.push(item.href);
                      }}
                      className={`group relative flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-2 text-center transition-all duration-200 ${
                        isActive || (isMore && profileMenuOpen) ? "sidebar-active scale-[1.02]" : "sidebar-link"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                          isActive || (isMore && profileMenuOpen) ? "dashboard-accent-surface" : "dashboard-subpanel"
                        }`}
                      >
                        <item.icon size={16} strokeWidth={2.2} />
                      </span>
                      <span
                        className={`text-[10px] font-semibold leading-none ${
                          isActive || (isMore && profileMenuOpen) ? "dashboard-text-strong" : "dashboard-text-muted"
                        }`}
                      >
                        {item.name}
                      </span>
                      <span
                        className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold opacity-0 transition-all group-hover:-translate-y-1 group-hover:opacity-100"
                        style={{
                          borderColor: "var(--dashboard-frame-border)",
                          background: "var(--dashboard-frame-bg)",
                          color: "var(--dashboard-text-strong)",
                        }}
                      >
                        {item.tooltip || item.name}
                      </span>
                    </button>
                  );
                })}
              </nav>

            </>,
            portalRoot
          )
        : null}
    </>
  );
};

export default UserSidebar;
