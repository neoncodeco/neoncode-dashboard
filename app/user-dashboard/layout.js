"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardMouseGlow from "@/components/DashboardMouseGlow";
import Loader from "@/components/Loader";
import { UserNotificationsProvider } from "@/components/UserNotificationsProvider";
import UserSidebar from "@/components/UserSidebar";
import UserDashboardTopbar from "@/components/UserDashboardTopbar";
import ReadOnlyNotice from "@/components/ReadOnlyNotice";
import LiveChatButton from "@/components/chat/LiveChatButton";
import useDashboardTheme from "@/hooks/useDashboardTheme";
import useAppAuth from "@/hooks/useAppAuth";
import { getDashboardPathByRole } from "@/lib/roleRouting";
import { isReadOnlyUserStatus } from "@/lib/userAccess";

export default function MainLayout({ children }) {
  const router = useRouter();
  const { authReady, loadingRole, role, user, userData } = useAppAuth();
  const { theme, toggleTheme } = useDashboardTheme();
  const readOnly = isReadOnlyUserStatus(userData?.status);

  useEffect(() => {
    if (!authReady || loadingRole) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role === "user") return;
    router.replace(getDashboardPathByRole(role));
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
        <div className="dashboard-content relative min-w-0 w-full overflow-visible pt-0 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] lg:flex-1 lg:pt-0 lg:pb-0 lg:overflow-y-auto">
        <UserNotificationsProvider>
          <UserDashboardTopbar theme={theme} toggleTheme={toggleTheme} />
          <div className="user-dashboard-stage px-4 pb-5 sm:px-4 lg:pb-6">
            <div className="user-dashboard-page-surface">{children}</div>
          </div>
          {!readOnly ? <LiveChatButton /> : null}
        </UserNotificationsProvider>
        {readOnly ? <ReadOnlyNotice /> : null}
      </div>
    </div>
  );
}
