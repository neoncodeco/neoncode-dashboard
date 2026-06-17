"use client";

import { useAdminUserDetail } from "@/components/admin/AdminUserDetailShell";
import { InsightsLoader, UserOverviewPanel } from "@/components/admin/userDetailShared";

export default function UserOverviewPage() {
  const { insights, insightsLoading } = useAdminUserDetail();

  if (insightsLoading) return <InsightsLoader />;

  return <UserOverviewPanel insights={insights} />;
}
