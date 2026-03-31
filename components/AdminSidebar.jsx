"use client";

import { createPortal } from "react-dom";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Banknote,
  LifeBuoy,
  Share2,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  MessageCircle,
  ClipboardList,
  Sun,
  Moon,
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Swal from "sweetalert2";
import DashboardThemeToggle from "@/components/DashboardThemeToggle";

const AdminSidebar = ({ theme, toggleTheme }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("");
  const portalRoot = typeof document !== "undefined" ? document.body : null;

  const { role, userData, logout } = useFirebaseAuth();

  useEffect(() => {
    if (!isMobileOpen && !mobilePanel) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
        setMobilePanel("");
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isMobileOpen, mobilePanel]);

  const menuItems = [
    {
      name: "Overview",
      icon: LayoutDashboard,
      href: "/admin-dashboard/overview",
      public: true,
    },
    {
      name: "All Users",
      icon: Users,
      href: "/admin-dashboard/users",
      adminOnly: true,
    },
    {
      name: "Meta Ads",
      icon: FolderKanban,
      href: "/admin-dashboard/meta-ads",
      permissionKey: "metaAdAccess",
    },
    {
      name: "Meta Logs",
      icon: ClipboardList,
      href: "/admin-dashboard/meta-logs",
      permissionKey: "metaAdAccess",
    },
    {
      name: "Transactions",
      icon: Banknote,
      href: "/admin-dashboard/transactions",
      permissionKey: "transactionsAccess",
    },
    {
      name: "Support Inbox",
      icon: LifeBuoy,
      href: "/admin-dashboard/support",
      public: true,
    },
    {
      name: "Live Chats",
      icon: MessageCircle,
      href: "/admin-dashboard/chats",
      public: true,
    },
    {
      name: "Affiliate Payouts",
      icon: Share2,
      href: "/admin-dashboard/affiliates",
      permissionKey: "affiliateAccess",
    },
    {
      name: "Controls & APIs",
      icon: Settings,
      href: "/admin-dashboard/settings",
      adminOnly: true,
    },
  ];

  const canShowMenu = (item) => {
    if (role === "admin") return true;
    if (role === "manager" && item.adminOnly) return false;
    if (role === "manager" && item.public) return true;
    if (role === "manager" && item.permissionKey) {
      return userData?.permissions?.[item.permissionKey] === true;
    }

    return false;
  };

  const visibleMenuItems = useMemo(
    () => menuItems.filter(canShowMenu),
    [role, userData]
  );

  const findMenuItem = (href) => visibleMenuItems.find((item) => item.href === href);

  const mobilePanels = useMemo(
    () => [
      {
        key: "meta",
        label: "Meta",
        icon: FolderKanban,
        items: [
          findMenuItem("/admin-dashboard/meta-ads"),
          findMenuItem("/admin-dashboard/meta-logs"),
          findMenuItem("/admin-dashboard/settings"),
        ].filter(Boolean),
      },
      {
        key: "support",
        label: "Support",
        icon: LifeBuoy,
        items: [
          findMenuItem("/admin-dashboard/support"),
          findMenuItem("/admin-dashboard/chats"),
          findMenuItem("/admin-dashboard/affiliates"),
        ].filter(Boolean),
      },
      {
        key: "manage",
        label: "Manage",
        icon: Users,
        items: [
          findMenuItem("/admin-dashboard/users"),
          findMenuItem("/admin-dashboard/transactions"),
        ].filter(Boolean),
      },
    ],
    [visibleMenuItems]
  );

  const activeMobilePanel = mobilePanels.find((panel) => panel.key === mobilePanel) || null;

  const HandalLogOut = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, log out",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await logout("/");
      } catch (error) {
        console.error("Logout error:", error);

        Swal.fire({
          icon: "error",
          title: "Logout Failed",
          text: "Something went wrong. Please try again.",
        });
      }
    }
  };

  const renderMenu = () => (
    <nav className="space-y-2">
      {visibleMenuItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
          >
            <div
              className={`flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 transition-all ${
                isActive ? "sidebar-active font-bold shadow-md" : "sidebar-link"
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.name}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {portalRoot
        ? createPortal(
            <>
              <div className="sidebar-shell fixed left-0 top-0 z-[60] flex w-full items-center justify-between border-b px-4 py-3 shadow-md lg:hidden">
                <div className="dashboard-accent-surface flex h-11 w-11 items-center justify-center rounded-2xl">
                  {userData?.photo ? (
                    <Image
                      src={userData.photo}
                      alt={userData?.name || "Admin"}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-2xl object-cover"
                    />
                  ) : (
                    <Image
                      src="/Neon Studio icon.png"
                      alt="Admin Logo"
                      width={20}
                      height={20}
                      priority
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="dashboard-app-frame sidebar-shell flex h-11 w-11 items-center justify-center rounded-2xl"
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                >
                  <span className="dashboard-accent-surface flex h-8 w-8 items-center justify-center rounded-2xl">
                    {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                  </span>
                </button>
              </div>

              {activeMobilePanel || isMobileOpen ? (
                <div className="fixed inset-0 z-[90] lg:hidden">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => {
                      setIsMobileOpen(false);
                      setMobilePanel("");
                    }}
                  />

                  <div
                    className="fixed inset-x-4 z-[91] flex justify-end lg:hidden"
                    style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 6.35rem)" }}
                  >
                    <div className="dashboard-app-frame sidebar-shell w-full max-w-[20rem] overflow-hidden rounded-[30px] p-3">
                      <div className="dashboard-subpanel flex items-center gap-3 p-3">
                        <div className="dashboard-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden">
                          {userData?.photo ? (
                            <Image
                              src={userData.photo}
                              alt={userData?.name || "Admin"}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-2xl object-cover"
                            />
                          ) : (
                            <Image
                              src="/Neon Studio icon.png"
                              alt="Admin Logo"
                              width={22}
                              height={22}
                              priority
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="dashboard-text-strong truncate text-sm font-bold">
                            {activeMobilePanel ? activeMobilePanel.label : userData?.name || "Neon Admin"}
                          </p>
                          <p className="dashboard-text-muted truncate text-[11px]">
                            {activeMobilePanel ? "Quick access shortcuts" : role === "admin" ? "Administrator shortcuts" : "Manager shortcuts"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2">
                        {!activeMobilePanel ? (
                          <DashboardThemeToggle
                            theme={theme}
                            toggleTheme={toggleTheme}
                            className="w-full justify-start rounded-2xl px-4 py-3"
                          />
                        ) : null}

                        {(activeMobilePanel ? activeMobilePanel.items : mobilePanels).map((item) => (
                          <button
                            key={activeMobilePanel ? item.name : item.key}
                            type="button"
                            onClick={() => {
                              if (activeMobilePanel) {
                                setIsMobileOpen(false);
                                setMobilePanel("");
                                router.push(item.href);
                                return;
                              }
                              setIsMobileOpen(false);
                              setMobilePanel(item.key);
                            }}
                            className={`dashboard-subpanel flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                              activeMobilePanel && pathname === item.href ? "sidebar-active" : ""
                            }`}
                          >
                            <span className="dashboard-subpanel flex h-9 w-9 items-center justify-center rounded-2xl">
                              <item.icon size={16} className="dashboard-text-muted" />
                            </span>
                            <span className="dashboard-text-strong text-sm font-semibold">
                              {activeMobilePanel ? item.name : item.label}
                            </span>
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            if (activeMobilePanel) {
                              setMobilePanel("");
                              setIsMobileOpen(true);
                              return;
                            }
                            HandalLogOut();
                          }}
                          className="dashboard-subpanel flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-red-400"
                        >
                          <span className="dashboard-subpanel flex h-9 w-9 items-center justify-center rounded-2xl">
                            {activeMobilePanel ? (
                              <Menu size={16} className="text-[var(--dashboard-text-muted)]" />
                            ) : (
                              <LogOut size={16} className="text-red-400" />
                            )}
                          </span>
                          <span className="text-sm font-semibold">
                            {activeMobilePanel ? "Back to shortcuts" : "Logout"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <nav
                className="dashboard-app-frame sidebar-shell fixed left-1/2 z-[70] grid w-[calc(100%-1.25rem)] max-w-[21rem] -translate-x-1/2 grid-cols-4 gap-2 rounded-[30px] px-3 py-2.5 lg:hidden"
                style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.55rem)" }}
              >
                {[
                  {
                    key: "home",
                    name: "Home",
                    icon: LayoutDashboard,
                    href: "/admin-dashboard/overview",
                  },
                  {
                    key: "meta",
                    name: "Meta",
                    icon: FolderKanban,
                  },
                  {
                    key: "support",
                    name: "Support",
                    icon: LifeBuoy,
                  },
                  {
                    key: "manage",
                    name: "Manage",
                    icon: Users,
                  },
                ].map((item) => {
                  const isActive =
                    item.key === "home"
                      ? pathname === item.href
                      : mobilePanels
                          .find((panel) => panel.key === item.key)
                          ?.items.some((panelItem) => panelItem.href === pathname);

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        if (item.key === "home") {
                          setIsMobileOpen(false);
                          setMobilePanel("");
                          router.push(item.href);
                          return;
                        }
                        setIsMobileOpen(false);
                        setMobilePanel(item.key);
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
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </>,
            portalRoot
          )
        : null}

      <div className="sidebar-shell hidden min-h-screen flex-col justify-between border-r p-6 lg:flex lg:w-64 xl:w-72">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
              <Image
                src="/Neon Studio icon.png"
                alt="Admin Logo"
                width={24}
                height={24}
                priority
              />
            </div>
            <div>
              <span className="block text-xl font-bold text-[var(--dashboard-text-strong)]">
                NEON ADMIN
              </span>
              <span className="admin-badge rounded px-2 py-0.5 text-[10px] uppercase tracking-widest">
                Control Panel
              </span>
            </div>
          </div>

          <div className="mb-6">
            <DashboardThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>

          {renderMenu()}
        </div>

        <div className="space-y-3 border-t border-[var(--dashboard-frame-border)] pt-6">
          <div className="flex cursor-pointer items-center gap-3 px-4 text-sm text-[var(--dashboard-text-muted)] transition hover:text-[var(--dashboard-text-strong)]">
            <ShieldCheck size={18} /> Admin Profile
          </div>
          <div
            onClick={HandalLogOut}
            className="flex cursor-pointer items-center gap-3 px-4 text-sm text-[var(--dashboard-text-muted)] transition hover:text-red-400"
          >
            <LogOut size={18} /> Logout
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
