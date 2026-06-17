"use client";

import { useAdminUserDetail } from "@/components/admin/AdminUserDetailShell";
import { InsightsLoader, UserTransactionsPanel } from "@/components/admin/userDetailShared";

export default function UserTransactionsPage() {
  const { insights, insightsLoading } = useAdminUserDetail();

  if (insightsLoading) return <InsightsLoader />;

  return <UserTransactionsPanel insights={insights} />;
}
