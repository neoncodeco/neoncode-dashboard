"use client";

import { useAdminAdAccountDetail } from "@/components/admin/AdminAdAccountDetailShell";
import { AdAccountEditPanel } from "@/components/admin/adAccountDetailShared";

export default function AdAccountEditPage() {
  const { account, token, loadAccount, setLive } = useAdminAdAccountDetail();

  return (
    <AdAccountEditPanel
      account={account}
      token={token}
      onLiveChange={setLive}
      onSaved={() => void loadAccount()}
    />
  );
}
