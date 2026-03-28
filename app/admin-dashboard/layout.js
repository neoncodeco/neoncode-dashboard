"use client";

import AdminSidebar from "@/components/AdminSidebar";
import DashboardMouseGlow from "@/components/DashboardMouseGlow";
import useDashboardTheme from "@/hooks/useDashboardTheme";
import React from "react";

export default function AdminLayout({ children }) {
  const { theme, toggleTheme } = useDashboardTheme();

  return (
    <div
      data-theme={theme}
      className={`dashboard-shell dashboard-theme-${theme} neon-grid block min-h-svh w-full overflow-visible lg:flex lg:h-screen lg:flex-row lg:overflow-hidden`}
    >
      <DashboardMouseGlow />
      <AdminSidebar theme={theme} toggleTheme={toggleTheme} />
      <div className="dashboard-content admin-dashboard-content min-w-0 w-full overflow-visible pt-16 text-[#f5f8ff] lg:flex-1 lg:pt-0 lg:h-full lg:overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
