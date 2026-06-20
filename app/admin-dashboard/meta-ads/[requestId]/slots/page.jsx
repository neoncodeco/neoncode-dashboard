"use client";

import { useAdminAdAccountDetail } from "@/components/admin/AdminAdAccountDetailShell";
import { AdAccountSlotsPanel } from "@/components/admin/adAccountDetailShared";

export default function AdAccountSlotsPage() {
  const { account, token, loadAccount } = useAdminAdAccountDetail();

  return (
    <AdAccountSlotsPanel account={account} token={token} onSaved={() => void loadAccount()} />
  );
}
