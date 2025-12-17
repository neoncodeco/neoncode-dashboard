"use client";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useState } from "react";

export default function ManageUserModal({ user, onClose, onUpdated }) {
  const { token } = useFirebaseAuth();

  /* ================= STATE ================= */

  const [role, setRole] = useState(user.role || "user");

  const [permissions, setPermissions] = useState(
    user.permissions || {
      projectsAccess: false,
      transactionsAccess: false,
      affiliateAccess: false,
      metaAdAccess: false,
    }
  );

  const [loading, setLoading] = useState(false);

  /* ================= HELPERS ================= */

  const toggle = (key) => {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  };

  /* ================= SUBMIT ================= */

  const submit = async () => {
    setLoading(true);

    const res = await fetch("/api/admin/users/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: user.userId, // ✅ FIXED (Firebase UID)
        role,
        permissions: role === "admin" ? null : permissions,
      }),
    });

    setLoading(false);

    if (res.ok) {
      onUpdated();
      onClose();
    } else {
      alert("Update failed");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-6">

        {/* ROLE */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3">Account Role</h3>
          {["admin", "manager", "user"].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`w-full mb-2 px-4 py-2 rounded-xl border text-left ${
                role === r
                  ? "border-green-500 text-green-600 font-bold"
                  : "border-gray-200"
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* PERMISSIONS (only for non-admin) */}
        {role !== "admin" && (
          <div>
            <h3 className="font-bold text-gray-800 mb-3">
              Access Permissions
            </h3>

            {[
              ["projectsAccess", "Projects Access"],
              ["transactionsAccess", "Transactions Access"],
              ["affiliateAccess", "Affiliate Access"],
              ["metaAdAccess", "Meta Ad Access"],
            ].map(([key, label]) => (
              <div
                key={key}
                className="flex justify-between items-center py-2"
              >
                <span className="text-sm text-gray-700">{label}</span>

                <button
                  onClick={() => toggle(key)}
                  className={`w-12 h-6 rounded-full relative transition ${
                    permissions[key] ? "bg-black" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
                      permissions[key] ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-lg"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
