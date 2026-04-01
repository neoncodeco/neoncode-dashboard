"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  CircleHelp,
  CreditCard,
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
  { name: "Wallet", icon: CreditCard, href: "/user-dashboard/payment-methods" },
];

function UserIdentity({ user }) {
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
    <div className="dashboard-subpanel flex items-center gap-3 p-3">
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
    </div>
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

  const renderMenu = () => (
    <nav className="space-y-1.5">
      {userDashboardMenuItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
              isActive
                ? "sidebar-active border text-white shadow-[0_10px_26px_rgba(183,223,105,0.12)]"
                : "sidebar-link border border-transparent"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                isActive ? "dashboard-accent-surface" : "dashboard-subpanel"
              }`}
            >
              <item.icon size={16} />
            </span>
            <span className="text-sm font-semibold">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const sidebarContent = (
    <>
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="dashboard-subpanel flex h-12 w-12 items-center justify-center rounded-2xl p-2.5">
            <Image src="/Neon Studio icon.png" alt="Logo" width={28} height={28} />
          </div>
          <div>
            <p className="text-[1.7rem] font-semibold tracking-tight dashboard-text-strong">
              Neon Code
            </p>
            <p className="text-[11px] uppercase tracking-[0.26em] dashboard-text-faint">
              Client Dashboard
            </p>
          </div>
        </div>

        {renderMenu()}
      </div>

      <div className="space-y-3 border-t pt-5" style={{ borderColor: "var(--dashboard-frame-border)" }}>
        <UserIdentity user={user} />

        

        <Link
          href="https://wa.me/8801344224787"
          target="_blank"
          className="dashboard-subpanel flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium dashboard-text-muted transition"
        >
          <CircleHelp size={18} />
          Help & Information
        </Link>

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
                  className="fixed inset-x-4 z-[85] flex justify-center lg:hidden"
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
                  className="fixed inset-x-4 z-[86] flex justify-end lg:hidden"
                  style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.25rem)" }}
                >
                  <div className="dashboard-app-frame sidebar-shell w-full max-w-[18.5rem] overflow-hidden rounded-[30px] p-3">
                    <div className="dashboard-subpanel flex items-center gap-3 p-3">
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
                      <div className="min-w-0">
                        <p className="dashboard-text-strong truncate text-sm font-bold">
                          {user?.displayName || "Neon Client"}
                        </p>
                        <p className="dashboard-text-muted truncate text-[11px]">
                          {user?.email || "Client account"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      <DashboardThemeToggle
                        theme={theme}
                        toggleTheme={toggleTheme}
                        className="w-full justify-start rounded-2xl px-4 py-3"
                      />

                      {[
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
                className="dashboard-app-frame sidebar-shell fixed left-1/2 z-[70] grid w-[calc(100%-1.25rem)] max-w-[21rem] -translate-x-1/2 grid-cols-4 gap-2 rounded-[30px] px-3 py-2.5 lg:hidden"
                style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.55rem)" }}
              >
                {mobileTabs.map((item) => {
                  const isActive = pathname === item.href;
                  const isServices = item.name === "Services";

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
                        setServicesMenuOpen(false);
                        setProfileMenuOpen(false);
                        router.push(item.href);
                      }}
                      className={`group relative flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[22px] px-2 py-3 text-center transition-all duration-200 ${
                        isActive ? "sidebar-active scale-[1.02]" : "sidebar-link"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
                          isActive ? "dashboard-accent-surface" : "dashboard-subpanel"
                        }`}
                      >
                        <item.icon size={18} strokeWidth={2.2} />
                      </span>
                      <span className="sr-only">{item.name}</span>
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

              <button
                type="button"
                onClick={toggleTheme}
                className="dashboard-app-frame sidebar-shell fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.95rem)] left-4 z-[88] flex h-12 w-12 items-center justify-center rounded-2xl lg:hidden"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                <span className="dashboard-accent-surface flex h-9 w-9 items-center justify-center rounded-2xl">
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setServicesMenuOpen(false);
                  setProfileMenuOpen((prev) => !prev);
                }}
                className="dashboard-app-frame sidebar-shell fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.95rem)] right-4 z-[88] flex h-12 w-12 items-center justify-center rounded-2xl lg:hidden"
                aria-label="Open profile menu"
              >
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    width={38}
                    height={38}
                    className="h-9 w-9 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="dashboard-accent-surface flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-black">
                    {user?.displayName?.slice(0, 1)?.toUpperCase() || "NC"}
                  </div>
                )}
                {profileMenuOpen ? (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-900">
                    <X size={12} />
                  </span>
                ) : null}
              </button>
            </>,
            portalRoot
          )
        : null}
    </>
  );
};

export default UserSidebar;
