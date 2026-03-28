"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  ClipboardList
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Swal from "sweetalert2";
import DashboardThemeToggle from "@/components/DashboardThemeToggle";

const AdminSidebar = ({ theme, toggleTheme }) => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { role, userData, logout } = useFirebaseAuth();

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

  /* ================= MENU CONFIG ================= */
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
    // {
    //   name: "Manage Projects",
    //   icon: FolderKanban,
    //   href: "/admin-dashboard/projects",
    //   permissionKey: "projectsAccess",
    // },
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

  /* ================= ACCESS CHECK ================= */
  const canShowMenu = (item) => {
    // ✅ Admin → সব access
    if (role === "admin") return true;

    // ⛔ Manager → admin-only route না
    if (role === "manager" && item.adminOnly) return false;

    // ✅ Manager → public route
    if (role === "manager" && item.public) return true;

    // ✅ Manager → permission based route
    if (role === "manager" && item.permissionKey) {
      return userData?.permissions?.[item.permissionKey] === true;
    }

    return false;
  };

  /* ================= LOGOUT HANDLER ================= */
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

  /* ================= MENU RENDER ================= */
  const renderMenu = () => (
    <nav className="space-y-2">
      {menuItems.filter(canShowMenu).map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
          >
            <div
              className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                isActive
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
      {/* ================= MOBILE HEADER ================= */}
      <div className="sidebar-shell fixed top-0 left-0 z-[60] flex w-full items-center justify-between border-b px-4 py-3 shadow-md lg:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <Image
              src="/Neon Studio icon.png"
              alt="Admin Logo"
              width={20}
              height={20}
              priority
            />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">
            NEON ADMIN
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="admin-secondary-button rounded-lg p-2 transition"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* ================= MOBILE SIDEBAR ================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          ></div>

          <div className="sidebar-shell absolute top-0 left-0 w-[80%] max-w-sm h-full shadow-2xl p-6 flex flex-col justify-between border-r">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                    <Image
                      src="/Neon Studio icon.png"
                      alt="Admin Logo"
                      width={24}
                      height={24}
                      priority
                    />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-white block">
                      NEON ADMIN
                    </span>
                    <span className="admin-badge rounded px-2 py-0.5 text-[10px] uppercase tracking-widest">
                      Control Panel
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="text-gray-400 hover:text-[#dce8ff]"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6">
                <DashboardThemeToggle theme={theme} toggleTheme={toggleTheme} />
              </div>

              {renderMenu()}
            </div>

            <div className="space-y-3 border-t border-[#22375d] pt-6">
              <div className="flex cursor-pointer items-center gap-3 px-4 text-sm text-gray-400 hover:text-[#dce8ff]">
                <ShieldCheck size={18} /> Admin Profile
              </div>
              <div
                onClick={HandalLogOut}
                className="flex cursor-pointer items-center gap-3 px-4 text-sm text-gray-400 hover:text-red-300"
              >
                <LogOut size={18} /> Logout
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="sidebar-shell hidden min-h-screen flex-col justify-between border-r p-6 lg:flex lg:w-64 xl:w-72">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              <Image
                src="/Neon Studio icon.png"
                alt="Admin Logo"
                width={24}
                height={24}
                priority
              />
            </div>
            <div>
              <span className="text-xl font-bold text-white block">
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

        <div className="space-y-3 border-t border-[#22375d] pt-6">
          <div className="flex cursor-pointer items-center gap-3 px-4 text-sm text-gray-400 hover:text-[#dce8ff]">
            <ShieldCheck size={18} /> Admin Profile
          </div>
          <div
            onClick={HandalLogOut}
            className="flex cursor-pointer items-center gap-3 px-4 text-sm text-gray-400 hover:text-red-300"
          >
            <LogOut size={18} /> Logout
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
