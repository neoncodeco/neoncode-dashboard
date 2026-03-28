"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu, QrCode, UserCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import DashboardThemeToggle from "@/components/DashboardThemeToggle";

const menuItems = [
  {
    name: "Public Card",
    href: "/team-member-dashboard",
    icon: UserCircle2,
  },
];

export default function TeamMemberSidebar({ theme, toggleTheme }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout, userData } = useFirebaseAuth();

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const publicUrl = userData?.teamMemberPublicUrl;

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
    <nav className="space-y-2">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
            <div
              className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition ${
                isActive ? "sidebar-active font-bold" : "sidebar-link"
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

  const renderSidebarContent = () => (
    <>
      <div>
        <div className="mb-10 flex items-center gap-3">
          <Image src="/Neon Studio icon.png" alt="Logo" width={34} height={34} />
          <div>
            <p className="text-lg font-black text-white">NEON TEAM</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-sky-200/70">Member Hub</p>
          </div>
        </div>

        <div className="mb-6">
          <DashboardThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>

        {renderMenu()}

        <div className="mt-8 rounded-[1.8rem] border border-sky-400/20 bg-sky-500/10 p-5 text-sm text-sky-50">
          <div className="mb-3 flex items-center gap-2 font-bold">
            <QrCode size={18} />
            Public QR
          </div>
          <p className="text-sky-100/75">
            Once your username is saved, your public card and QR stay linked to that username.
          </p>
          {publicUrl ? (
            <Link
              href={publicUrl}
              target="_blank"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-sky-200"
            >
              Open public profile
              <ExternalLink size={14} />
            </Link>
          ) : null}
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 transition hover:text-red-300"
      >
        <LogOut size={18} />
        {isLoggingOut ? "Logging out..." : "Log out"}
      </button>
    </>
  );

  return (
    <>
      <div className="sidebar-shell fixed left-0 top-0 z-[60] flex w-full items-center justify-between border-b px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Image src="/Neon Studio icon.png" alt="Logo" width={24} height={24} />
          <span className="text-lg font-bold text-white">team dashboard</span>
        </div>
        <button type="button" onClick={() => setIsOpen(true)} className="rounded-lg p-2 text-white" aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIsOpen(false)} />
          <div className="sidebar-shell absolute left-0 top-0 flex h-full w-[82%] max-w-sm flex-col justify-between border-r p-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {renderSidebarContent()}
          </div>
        </div>
      ) : null}

      <div className="sidebar-shell hidden min-h-screen w-72 flex-col justify-between border-r p-6 lg:flex xl:w-80">
        {renderSidebarContent()}
      </div>
    </>
  );
}
