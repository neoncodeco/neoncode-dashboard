"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardMouseGlow from "@/components/DashboardMouseGlow";
import Loader from "@/components/Loader";
import TeamMemberSidebar from "@/components/TeamMemberSidebar";
import useDashboardTheme from "@/hooks/useDashboardTheme";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function TeamMemberLayout({ children }) {
  const router = useRouter();
  const { authReady, loadingRole, user, role } = useFirebaseAuth();
  const { theme, toggleTheme } = useDashboardTheme();

  useEffect(() => {
    if (!authReady || loadingRole) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role === "team_member") return;

    if (role === "admin" || role === "manager") {
      router.replace("/admin-dashboard/overview");
      return;
    }

    router.replace("/user-dashboard/overview");
  }, [authReady, loadingRole, role, router, user]);

  if (!authReady || loadingRole || !user || role !== "team_member") {
    return <Loader />;
  }

  return (
    <div
      data-theme={theme}
      className={`dashboard-shell dashboard-theme-${theme} neon-grid block min-h-svh w-full overflow-visible lg:flex lg:h-screen lg:flex-row lg:overflow-hidden`}
    >
      <DashboardMouseGlow />
      <TeamMemberSidebar theme={theme} toggleTheme={toggleTheme} />
      <div className="dashboard-content min-w-0 w-full overflow-visible pt-16 lg:flex-1 lg:pt-0 lg:overflow-y-auto">{children}</div>
    </div>
  );
}
