"use client";

import { useAdminUserDetail } from "@/components/admin/AdminUserDetailShell";
import { UserAddAccountPanel } from "@/components/admin/userDetailShared";

export default function UserAddAccountPage() {
  const { userId, display, token, loadInsights } = useAdminUserDetail();

  return (
    <UserAddAccountPanel
      userId={userId}
      userEmail={display.email}
      token={token}
      onAdded={() => void loadInsights({ silent: true })}
    />
  );
}
