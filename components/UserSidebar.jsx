"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LayoutGrid,
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
    } catch (e) {
      console.error("Logout failed:", e);
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/user-dashboard/overview" },
     { name: "Our Services", icon: CheckSquare, href: "/user-dashboard/services" },
    { name: "Meta Ads Account", icon: LayoutDashboard, href: "/user-dashboard/meta-ads-account" },
    // { name: "Projects", icon: LayoutGrid, href: "/user-dashboard/projects" },
    // { name: "Tasks", icon: CheckSquare, href: "/user-dashboard/tasks" },
     {
      name: "Freepik Premium",
      icon: Crown,
      href: "/user-dashboard/freepik-premium",
    },
    {
      name: "Payment Methods",
      icon: CreditCard,
      href: "/user-dashboard/payment-methods",
    },
    {
      name: "History",
      icon: History,
      href: "/user-dashboard/history",
    },
    {
      name: "Support Tickets",
      icon: LifeBuoy,
      href: "/user-dashboard/support",
    },
   
    { name: "Profile", icon: UserPlus, href: "/user-dashboard/profile" },
      { name: "Affiliate", icon: Share2, href: "/user-dashboard/affiliate" },
  ];

  const renderMenu = (isMobile = false) => (
    <nav className="space-y-2">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
          >
            <div
              className={`mb-2 flex items-center gap-4 rounded-xl px-4 py-3 transition-all ${
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
      {/* ================= Mobile Header ================= */}
      <div className="sidebar-shell fixed top-0 left-0 z-[60] flex w-full justify-between items-center border-b px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Image src="/Neon Studio icon.png" alt="Logo" width={24} height={24} />
          <span className="font-bold text-white text-lg">Neon Code</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="rounded-lg p-2 text-white"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* ================= Mobile Drawer ================= */}
      <div
        className={`fixed inset-0 z-[90] lg:hidden transition ${
          isMobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isMobileOpen}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
            isMobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileOpen(false)}
        />

        <div
          className={`absolute top-0 left-0 z-10 flex h-full w-[84%] max-w-sm flex-col overflow-y-auto border-r border-[#22375d] bg-[#0f1d38] p-6 text-white shadow-2xl transition-transform duration-300 ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>

          <div className="mb-8 mt-4 text-center">
            <Image
              src="/Neon Studio icon.png"
              alt="Logo"
              width={64}
              height={64}
              className="mx-auto mb-3"
            />
            <h2 className="text-white text-xl font-bold">Neon Code</h2>
            <p className="text-xs text-slate-300">Dashboard Panel</p>
          </div>

          <div className="mb-6">
            <DashboardThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>

          {renderMenu(true)}

          <div className="mt-auto space-y-6 pt-6">
            <div className="rounded-2xl border border-[#2f5e18] bg-[#1a350e] p-5 text-center">
              <h3 className="mb-1 font-bold text-white">Upgrade to Pro</h3>
              <p className="mb-4 text-xs text-gray-300">Get 1 month free and unlock</p>
              <Link href="/upgrade" onClick={() => setIsMobileOpen(false)}>
                <button className="w-full rounded-xl bg-white py-2 font-bold text-[#1a350e]">
                  Upgrade
                </button>
              </Link>
            </div>

            <div className="space-y-4 border-t border-[#2f5e18] pt-4">
              <Link href="/help" onClick={() => setIsMobileOpen(false)}>
                <div className="flex items-center gap-3 text-sm text-gray-300 hover:text-white">
                  <HelpCircle size={18} />
                  Help & Information
                </div>
              </Link>

              {user ? (
                <div
                  onClick={handleLogout}
                  className="flex cursor-pointer items-center gap-3 text-sm text-gray-300 hover:text-red-400"
                >
                  <LogOut size={18} />
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </div>
              ) : (
                <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                  <div className="flex items-center gap-3 text-sm text-gray-300 hover:text-white">
                    <LogOut size={18} />
                    Log in
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= Desktop Sidebar ================= */}
      <div className="sidebar-shell hidden min-h-screen flex-col justify-between border-r p-6 lg:flex lg:w-64 xl:w-72">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <Image src="/Neon Studio icon.png" alt="Logo" width={32} height={32} />
            <span className="text-white text-2xl font-bold"> Neon Dashboard</span>
          </div>
          <div className="mb-6">
            <DashboardThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
          {renderMenu(false)}
        </div>

        <div className="space-y-6">
          {/* <div className="bg-[#1a350e] p-5 rounded-2xl text-center border border-[#2f5e18]">
            <h3 className="text-white font-bold mb-1">Upgrade to Pro</h3>
            <p className="text-xs text-gray-300 mb-4">
              Get 1 month free and unlock
            </p>
            <Link href="/upgrade">
              <button className="w-full bg-white text-[#1a350e] py-2 rounded-xl font-bold">
                Upgrade
              </button>
            </Link>
          </div> */}

          <div className="pt-4  border-t border-[#2f5e18] space-y-3">
            <Link href="https://wa.me/8801344224787" target="_blank">
              <div className="flex items-center gap-3 text-gray-300 hover:text-white text-sm">
                <HelpCircle size={18} />
                Help & Information
              </div>
            </Link>

            {user ? (
              <div
                onClick={handleLogout}
                className="flex items-center gap-3 pt-4 text-gray-300 hover:text-red-400 text-sm cursor-pointer"
              >
                <LogOut size={18} />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </div>
            ) : (
              <Link href="/login">
                <div className="flex items-center gap-3 pt-4 text-gray-300 hover:text-white text-sm">
                  <LogOut size={18} />
                  Log in
                </div>
              </Link>
            )}
          </div>
        </div>

        
      </div>

    </>
  );
};

export default UserSidebar;
