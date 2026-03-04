"use client";

import AdminSidebar from "@/components/AdminSidebar";
import DashboardMouseGlow from "@/components/DashboardMouseGlow";
import React from "react";

export default function AdminLayout({ children }) {
  return (
    <div className="dashboard-shell neon-grid flex h-screen w-full overflow-hidden">
      <DashboardMouseGlow />
      <AdminSidebar />
      <div className="dashboard-content admin-dashboard-content flex-1 h-full overflow-y-auto text-[#f5f8ff]">
        {children}
      </div>
    </div>
  );
}
