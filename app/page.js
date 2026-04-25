"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useAppAuth from "@/hooks/useAppAuth";
import Loader from "@/components/Loader";
import { getDashboardPathByRole } from "@/lib/roleRouting";

export default function Home() {
  const router = useRouter();
  const { user, role, authReady, loadingRole } = useAppAuth();

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (loadingRole || !role) return;

    const destination = getDashboardPathByRole(role);
    router.prefetch(destination);
    router.replace(destination);
  }, [authReady, user, role, loadingRole, router]);

  return <Loader />;
}
