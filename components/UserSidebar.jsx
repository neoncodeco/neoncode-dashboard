"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  UserPlus,
  CreditCard,
  History,
  LifeBuoy,
  Share2,
  Crown,
  LogOut,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import DashboardThemeToggle from "@/components/DashboardThemeToggle";

const UserSidebar = ({ theme, toggleTheme }) => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useFirebaseAuth();

  useEffect(() => {
    if (!isMobileOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

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

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/user-dashboard/overview" },
    { name: "Our Services", icon: CheckSquare, href: "/user-dashboard/services" },
    { name: "Meta Ads Account", icon: LayoutDashboard, href: "/user-dashboard/meta-ads-account" },
    { name: "Freepik Premium", icon: Crown, href: "/user-dashboard/freepik-premium" },
    { name: "Payment Methods", icon: CreditCard, href: "/user-dashboard/payment-methods" },
    { name: "History", icon: History, href: "/user-dashboard/history" },
    { name: "Support Tickets", icon: LifeBuoy, href: "/user-dashboard/support" },
    { name: "Profile", icon: UserPlus, href: "/user-dashboard/profile" },
    { name: "Affiliate", icon: Share2, href: "/user-dashboard/affiliate" },
  ];

  const renderMenu = (isMobile = false) => (
    <nav className="space-y-2">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link key={item.name} href={item.href} onClick={() => setIsMobileOpen(false)}>
            <div
              className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all ${
                isMobile
                  ? isActive
                    ? "border border-[#8ab4ff]/30 bg-[#18315c] font-bold text-white shadow-md"
                    : "border border-transparent bg-white/5 text-[#dce8ff]"
                  : isActive
                  ? "sidebar-active font-bold shadow-md"
                  : "sidebar-link"
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
      <div className="sidebar-shell fixed left-0 top-0 z-[80] flex w-full items-center justify-between border-b px-4 py-3 shadow-md lg:hidden">
        <div className="flex items-center gap-2">
          <Image src="/Neon Studio icon.png" alt="Logo" width={24} height={24} />
          <span className="text-lg font-bold text-white">Neon Code</span>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="rounded-xl bg-white/5 p-2 text-white transition active:scale-95"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-[140] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />

          <div className="sidebar-shell absolute left-0 top-0 flex h-full w-[84%] max-w-sm flex-col border-r border-[#22375d] p-6 shadow-2xl">
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/Neon Studio icon.png" alt="Logo" width={32} height={32} />
                  <div>
                    <p className="text-lg font-bold text-white">Neon Code</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Dashboard</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-full bg-white/10 p-2 text-white"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <DashboardThemeToggle theme={theme} toggleTheme={toggleTheme} />
              </div>

              {renderMenu(true)}
            </div>

            <div className="mt-auto space-y-3 border-t border-[#22375d] pt-6">
              <Link
                href="https://wa.me/8801344224787"
                target="_blank"
                onClick={() => setIsMobileOpen(false)}
              >
                <div className="flex items-center gap-3 text-sm text-gray-300 hover:text-white">
                  <HelpCircle size={18} />
                  Help & Information
                </div>
              </Link>

              {user ? (
                <div
                  onClick={handleLogout}
                  className="flex cursor-pointer items-center gap-3 pt-2 text-sm text-red-400"
                >
                  <LogOut size={18} />
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </div>
              ) : (
                <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                  <div className="flex items-center gap-3 pt-2 text-sm text-gray-300 hover:text-white">
                    <LogOut size={18} />
                    Log in
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="sidebar-shell sticky top-0 hidden h-screen flex-col justify-between border-r p-6 lg:flex lg:w-64 xl:w-72">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <Image src="/Neon Studio icon.png" alt="Logo" width={32} height={32} />
            <span className="text-2xl font-bold text-white">Neon Code</span>
          </div>

          <div className="mb-6">
            <DashboardThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>

          {renderMenu(false)}
        </div>

        <div className="space-y-3 border-t border-[#22375d] pt-6">
          <Link href="https://wa.me/8801344224787" target="_blank">
            <div className="flex items-center gap-3 text-sm text-gray-300 hover:text-white">
              <HelpCircle size={18} />
              Help & Information
            </div>
          </Link>

          {user ? (
            <div
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-3 pt-2 text-sm text-gray-400 hover:text-red-400"
            >
              <LogOut size={18} />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </div>
          ) : (
            <Link href="/login">
              <div className="flex items-center gap-3 pt-2 text-sm text-gray-300 hover:text-white">
                <LogOut size={18} />
                Log in
              </div>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default UserSidebar;
