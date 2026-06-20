"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useAdminAdAccountDetail } from "@/components/admin/AdminAdAccountDetailShell";
import { AdAccountOverviewPanel } from "@/components/admin/adAccountDetailShared";

export default function AdAccountOverviewPage() {
  const router = useRouter();
  const { account, token, loadAccount } = useAdminAdAccountDetail();
  const [saving, setSaving] = useState(false);

  const handleAction = useCallback(
    async (action) => {
      if (!token || !account?._id) return;

      if (action === "delete") {
        const confirm = await Swal.fire({
          title: "Delete this request?",
          text: "This cannot be undone.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc2626",
        });
        if (!confirm.isConfirmed) return;

        setSaving(true);
        try {
          const res = await fetch("/api/admin/ads-request/approve", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ id: account._id }),
          });
          if (!res.ok) throw new Error("Delete failed");
          router.push("/admin-dashboard/meta-ads");
        } catch (err) {
          await Swal.fire("Error", err.message, "error");
        } finally {
          setSaving(false);
        }
        return;
      }

      if (action === "active" && !account.MetaAccountID) {
        await Swal.fire("Meta ID required", "Set a Meta Account ID before activating.", "warning");
        router.push(`/admin-dashboard/meta-ads/${encodeURIComponent(account._id)}/edit`);
        return;
      }

      const confirm = await Swal.fire({
        title: `Confirm ${action}?`,
        icon: "question",
        showCancelButton: true,
      });
      if (!confirm.isConfirmed) return;

      setSaving(true);
      try {
        const res = await fetch("/api/admin/ads-request/approve", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            id: account._id,
            status: action,
            MetaAccountID: account.MetaAccountID || "",
          }),
        });
        if (!res.ok) throw new Error("Action failed");
        await loadAccount();
        Swal.fire("Done", "", "success");
      } catch (err) {
        await Swal.fire("Error", err.message, "error");
      } finally {
        setSaving(false);
      }
    },
    [account, loadAccount, router, token]
  );

  return <AdAccountOverviewPanel account={account} onAction={handleAction} saving={saving} />;
}
