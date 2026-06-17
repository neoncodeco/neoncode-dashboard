"use client";

import { useAdminUserDetail } from "@/components/admin/AdminUserDetailShell";
import { InsightsLoader, UserActivityPanel } from "@/components/admin/userDetailShared";

export default function UserActivityPage() {
  const { insights, insightsLoading } = useAdminUserDetail();

  if (insightsLoading) return <InsightsLoader />;

  return <UserActivityPanel insights={insights} />;
}
