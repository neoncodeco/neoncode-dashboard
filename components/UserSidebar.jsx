"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CircleHelp,
  CreditCard,
  Ellipsis,
  Headset,
  Home,
  LogOut,
  Layers3,
  LifeBuoy,
  Moon,
  PackageOpen,
  Share2,
  Sun,
  WalletCards,
  History,
  X,
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
  { name: "Live Chat", href: "/user-dashboard/profile?panel=chat", icon: Headset },
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
  const searchParams = useSearchParams();
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

  const mainMenuItems = useMemo(
    () => userDashboardMenuItems.filter((item) => !["Support Tickets", "Affiliate"].includes(item.name)),
    []
  );

  const renderMenu = () => (
    <nav className="space-y-1.5">
      {mainMenuItems.map((item) => {
        const isActive = pathname === item.href;
        const isProfileItem = item.name === "Profile";
        const isProfileSectionActive =
          pathname === "/user-dashboard/profile" ||
          pathname === "/user-dashboard/support" ||
          pathname === "/user-dashboard/history" ||
          pathname === "/user-dashboard/affiliate";

        return (
          <div key={item.name} className="space-y-2">
            <Link
              href={item.href}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                isActive || (isProfileItem && isProfileSectionActive)
                  ? "sidebar-active border text-white shadow-[0_10px_26px_rgba(183,223,105,0.12)]"
                  : "sidebar-link border border-transparent"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                  isActive || (isProfileItem && isProfileSectionActive) ? "dashboard-accent-surface" : "dashboard-subpanel"
                }`}
              >
                <item.icon size={16} />
              </span>
              <span className="text-sm font-semibold">{item.name}</span>
            </Link>

            {isProfileItem ? (
              <div className="ml-4 space-y-1.5 border-l border-[var(--dashboard-frame-border)] pl-3">
                {profileSubItems.map((subItem) => {
                  const isSubActive =
                    pathname === subItem.href ||
                    (subItem.href.includes("?panel=chat") &&
                      pathname === "/user-dashboard/profile" &&
                      searchParams.get("panel") === "chat");

                  return (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all ${
                        isSubActive ? "sidebar-active" : "sidebar-link"
                      }`}
                    >
                      <span className="dashboard-subpanel flex h-8 w-8 items-center justify-center rounded-xl">
                        <subItem.icon size={15} className="dashboard-text-muted" />
                      </span>
                      <span className="font-medium">{subItem.name}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <>
      <div>
        <Link href="/user-dashboard/overview" className="mb-6 flex items-center gap-3 rounded-2xl transition hover:opacity-90">
          <span className="dashboard-subpanel flex h-12 w-12 items-center justify-center rounded-2xl p-2.5">
            <Image src="/neon-code-logo.jpg" alt="Logo" width={28} height={28} />
          </span>
          <div>
            <p className="text-[1.7rem] font-semibold tracking-tight dashboard-text-strong">
              Neon Code
            </p>
            <p className="text-[11px] uppercase tracking-[0.26em] dashboard-text-faint">
              User Dashboard
            </p>
          </div>
        </Link>

        {renderMenu()}
      </div>

      <div className="space-y-3 border-t pt-5" style={{ borderColor: "var(--dashboard-frame-border)" }}>
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="dashboard-subpanel flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium dashboard-text-muted transition hover:text-red-400"
          >
            <LogOut size={18} />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        ) : (
          <Link
            href="/login"
            className="dashboard-subpanel flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium dashboard-text-muted"
          >
            <LogOut size={18} />
            Login
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:block lg:w-[300px] lg:flex-shrink-0">
        <div className="sticky top-4 h-[calc(100vh-2rem)] p-4">
          <div className="dashboard-app-frame sidebar-shell flex h-full flex-col justify-between p-6">
            {sidebarContent}
          </div>
        </div>
      </aside>

      {portalRoot
        ? createPortal(
            <>
              {servicesMenuOpen ? (
                <div
                  className="fixed inset-x-4 z-[85] hidden justify-center"
                  style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.25rem)" }}
                >
                  <div className="dashboard-app-frame sidebar-shell w-full max-w-[21rem] overflow-hidden rounded-[30px] p-3">
                    <div className="grid gap-2">
                      {[
                        { name: "Our Services", href: "/user-dashboard/services", icon: Layers3 },
                        { name: "Freepik Premium", href: "/user-dashboard/freepik-premium", icon: PackageOpen },
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
                  className="fixed inset-x-4 z-[86] hidden justify-end"
                  style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.25rem)" }}
                >
                  <div className="dashboard-app-frame sidebar-shell w-full max-w-[18.5rem] overflow-hidden rounded-[30px] p-3">
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
                className="dashboard-app-frame sidebar-shell fixed left-1/2 z-[70] hidden w-[calc(100%-1.25rem)] max-w-[21rem] -translate-x-1/2 grid-cols-4 gap-2 rounded-[30px] px-3 py-2.5"
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
                      className={`group relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[22px] px-2 py-3 text-center transition-all duration-200 ${
                        isActive || (isMore && profileMenuOpen) ? "sidebar-active scale-[1.02]" : "sidebar-link"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                          isActive || (isMore && profileMenuOpen) ? "dashboard-accent-surface" : "dashboard-subpanel"
                        }`}
                      >
                        <item.icon size={18} strokeWidth={2.2} />
                      </span>
                      <span
                        className={`text-[10px] font-semibold leading-none ${
                          isActive || (isMore && profileMenuOpen) ? "text-white" : "dashboard-text-muted"
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
