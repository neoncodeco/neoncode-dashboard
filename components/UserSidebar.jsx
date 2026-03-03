"use client";

import React, { useState } from "react";
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
  LogOut,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import LogoutModal from "./LogoutModal";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

const UserSidebar = () => {
  const pathname = usePathname();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { user } = useFirebaseAuth();

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/user-dashboard/overview" },
    { name: "Meta Ads Account", icon: LayoutDashboard, href: "/user-dashboard/meta-ads-account" },
    // { name: "Projects", icon: LayoutGrid, href: "/user-dashboard/projects" },
    // { name: "Tasks", icon: CheckSquare, href: "/user-dashboard/tasks" },
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
    { name: "Affiliate", icon: Share2, href: "/user-dashboard/affiliate" },
    { name: "Profile", icon: UserPlus, href: "/user-dashboard/profile" }
  ];

  const renderMenu = () => (
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
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all mb-2 ${
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
      {/* ================= Mobile Header ================= */}
      <div className="sidebar-shell md:hidden fixed top-0 left-0 w-full z-50 px-4 py-3 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <Image src="/Neon Studio icon.png" alt="Logo" width={24} height={24} />
          <span className="font-bold text-white text-lg">neonstudio</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2  rounded-lg text-white"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* ================= Mobile Drawer ================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileOpen(false)}
          />

          <div className="sidebar-shell absolute top-0 left-0 w-[80%] max-w-sm h-full p-6 flex flex-col overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white"
            >
              <X size={20} />
            </button>

            {/* Logo */}
            <div className="text-center mb-8 mt-4">
              <Image
                src="/Neon Studio icon.png"
                alt="Logo"
                width={64}
                height={64}
                className="mx-auto mb-3"
              />
              <h2 className="text-white text-xl font-bold">NEON STUDIO</h2>
              <p className="text-xs text-gray-300">Dashboard Panel</p>
            </div>

            {/* Menu */}
            {renderMenu()}

            {/* Bottom Section */}
            <div className="mt-auto space-y-6">
              {/* Upgrade */}
              <div className="bg-[#1a350e] p-5 rounded-2xl text-center border border-[#2f5e18]">
                <h3 className="text-white font-bold mb-1">Upgrade to Pro</h3>
                <p className="text-xs text-gray-300 mb-4">
                  Get 1 month free and unlock
                </p>
                <Link href="/upgrade" onClick={() => setIsMobileOpen(false)}>
                  <button className="w-full bg-white text-[#1a350e] py-2 rounded-xl font-bold">
                    Upgrade
                  </button>
                </Link>
              </div>

              {/* Help + Logout */}
              <div className="pt-4 border-t border-[#2f5e18] space-y-4">
                <Link href="/help" onClick={() => setIsMobileOpen(false)}>
                  <div className="flex items-center gap-3 text-gray-300 hover:text-white text-sm">
                    <HelpCircle size={18} />
                    Help & Information
                  </div>
                </Link>

                {user ? (
                  <div
                    onClick={() => {
                      setIsMobileOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="flex items-center gap-3 text-gray-300 hover:text-red-400 text-sm cursor-pointer"
                  >
                    <LogOut size={18} />
                    Log out
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                    <div className="flex items-center gap-3 text-gray-300 hover:text-white text-sm">
                      <LogOut size={18} />
                      Log in
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= Desktop Sidebar ================= */}
      <div className="sidebar-shell hidden md:flex md:w-64 xl:w-72 min-h-screen p-6 flex-col justify-between border-r">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <Image src="/Neon Studio icon.png" alt="Logo" width={32} height={32} />
            <span className="text-white text-2xl font-bold">neonstudio</span>
          </div>
          {renderMenu()}
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
            <Link href="/">
              <div className="flex items-center gap-3 text-gray-300 hover:text-white text-sm">
                <HelpCircle size={18} />
                Help & Information
              </div>
            </Link>

            {user ? (
              <div
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-3 pt-4 text-gray-300 hover:text-red-400 text-sm cursor-pointer"
              >
                <LogOut size={18} />
                Log out
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

      {/* Logout Modal */}
      {showLogoutModal && (
        <LogoutModal setShowLogoutModal={setShowLogoutModal} />
      )}
    </>
  );
};

export default UserSidebar;
