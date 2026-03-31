"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardMouseGlow from "@/components/DashboardMouseGlow";
import Loader from "@/components/Loader";
import UserSidebar from "@/components/UserSidebar";
import UserDashboardTopbar from "@/components/UserDashboardTopbar";
import LiveChatButton from "@/components/chat/LiveChatButton";
import useDashboardTheme from "@/hooks/useDashboardTheme";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function MainLayout({ children }) {
  const router = useRouter();
  const { authReady, loadingRole, role, user } = useFirebaseAuth();
  const { theme, toggleTheme } = useDashboardTheme();

  useEffect(() => {
    if (!authReady || loadingRole) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role === "user") return;

    if (role === "team_member") {
      router.replace("/team-member-dashboard");
      return;
    }

    if (role === "admin" || role === "manager") {
      router.replace("/admin-dashboard/overview");
    }
  }, [authReady, loadingRole, role, router, user]);

  if (!authReady || loadingRole || !user || role !== "user") {
    return <Loader />;
  }

  return (
    <div
      data-theme={theme}
      className={`dashboard-shell user-dashboard-shell dashboard-theme-${theme} neon-grid block min-h-svh w-full overflow-visible lg:flex lg:h-screen lg:flex-row lg:overflow-hidden`}
    >
      <DashboardMouseGlow />
      <UserSidebar theme={theme} toggleTheme={toggleTheme} />
      <div className="dashboard-content min-w-0 w-full overflow-visible pt-0 pb-28 lg:flex-1 lg:pt-0 lg:pb-0 lg:overflow-y-auto">
        <UserDashboardTopbar theme={theme} toggleTheme={toggleTheme} />
        <div className="user-dashboard-stage px-4 pb-5 sm:px-4 lg:pb-6">
          <div className="user-dashboard-page-surface">{children}</div>
        </div>
        <LiveChatButton />
      </div>
    </div>
  );
}
