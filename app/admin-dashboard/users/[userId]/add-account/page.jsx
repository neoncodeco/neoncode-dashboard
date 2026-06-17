"use client";

import { useAdminUserDetail } from "@/components/admin/AdminUserDetailShell";
import { UserAddAccountPanel } from "@/components/admin/userDetailShared";
import { DEFAULT_USD_TO_BDT_RATE } from "@/lib/currency";

export default function UserAddAccountPage() {
  const { user, userId, display, token, loadInsights } = useAdminUserDetail();

  return (
    <UserAddAccountPanel
      userId={userId}
      userEmail={display.email}
      usdToBdtRate={Number(user?.metaAdsConfig?.usdRate) || DEFAULT_USD_TO_BDT_RATE}
      token={token}
      onAdded={() => void loadInsights({ silent: true })}
    />
  );
}
