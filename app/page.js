"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Loader from "@/components/Loader";
import { userDashboardRoutes } from "@/lib/userDashboardRoutes";

export default function Home() {
  const router = useRouter();
  const { user, role, authReady, loadingRole } = useFirebaseAuth();

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (loadingRole || !role) return;

    if (role === "admin" || role === "manager") {
      router.replace("/admin-dashboard/overview");
      return;
    }

    if (role === "team_member") {
      router.replace("/team-member-dashboard");
      return;
    }

    router.replace(userDashboardRoutes.dashboard);
  }, [authReady, user, role, loadingRole, router]);

  return <Loader />;
}
