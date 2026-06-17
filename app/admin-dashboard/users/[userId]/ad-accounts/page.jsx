"use client";

import { useAdminUserDetail } from "@/components/admin/AdminUserDetailShell";
import { InsightsLoader, UserAdAccountsPanel } from "@/components/admin/userDetailShared";

export default function UserAdAccountsPage() {
  const { insights, insightsLoading, refreshing, loadInsights } = useAdminUserDetail();

  if (insightsLoading) return <InsightsLoader />;

  return (
    <UserAdAccountsPanel
      insights={insights}
      refreshing={refreshing}
      onRefresh={() => void loadInsights({ silent: true })}
    />
  );
}
