"use client";

import { useAdminUserDetail } from "@/components/admin/AdminUserDetailShell";
import { InsightsLoader, UserMetaAdsHistoryPanel } from "@/components/admin/userDetailShared";

export default function UserMetaAdsHistoryPage() {
  const { insights, insightsLoading } = useAdminUserDetail();

  if (insightsLoading) return <InsightsLoader />;

  return <UserMetaAdsHistoryPanel insights={insights} />;
}
