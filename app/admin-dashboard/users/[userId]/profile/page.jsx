"use client";

import { useMemo } from "react";
import { useAdminUserDetail } from "@/components/admin/AdminUserDetailShell";
import { ManageUserPanel } from "@/components/ManageUserModal";
import Swal from "sweetalert2";

export default function UserProfilePage() {
  const { user, loadUser, setLive } = useAdminUserDetail();

  const profileTabs = useMemo(
    () => (user?.role === "team_member" ? ["Profile", "Team Card"] : ["Profile"]),
    [user?.role]
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-bold text-gray-900">Profile</h2>
        <p className="mt-0.5 text-xs text-gray-500">Name, email, role, status, and access permissions.</p>
      </div>
      <div className="p-4 sm:p-5">
        <ManageUserPanel
          user={user}
          variant="page"
          formId="manage-user-profile-panel"
          initialTab="Profile"
          visibleTabs={profileTabs}
          showTabNav={profileTabs.length > 1}
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
