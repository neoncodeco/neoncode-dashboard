"use client";

import { useAdminUserDetail } from "@/components/admin/AdminUserDetailShell";
import { ManageUserPanel } from "@/components/ManageUserModal";
import Swal from "sweetalert2";

export default function UserSettingsPage() {
  const { user, loadUser, setLive } = useAdminUserDetail();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-bold text-gray-900">Meta Ads settings</h2>
        <p className="mt-0.5 text-xs text-gray-500">Budget controls and Meta ads access. Dollar rates are managed from Dollar Rates.</p>
      </div>
      <div className="p-4 sm:p-5">
        <ManageUserPanel
          user={user}
          variant="page"
          formId="manage-user-panel"
          initialTab="Meta Ads"
          visibleTabs={["Meta Ads"]}
          showTabNav={false}
          showFooter={false}
          onLiveChange={setLive}
          onUpdated={() => {
            void loadUser();
            Swal.fire({
              title: "Saved",
              text: "User profile updated successfully.",
              icon: "success",
              timer: 1800,
              showConfirmButton: false,
            });
          }}
        />
      </div>
    </div>
  );
}
