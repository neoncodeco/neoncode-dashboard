"use client";

import { useAdminAdAccountDetail } from "@/components/admin/AdminAdAccountDetailShell";
import { AdAccountUserPanel } from "@/components/admin/adAccountDetailShared";

export default function AdAccountLinkedUserPage() {
  const { account } = useAdminAdAccountDetail();
  return <AdAccountUserPanel account={account} />;
}
