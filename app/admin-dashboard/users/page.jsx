"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Shield, Trash2, Download } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import ManageUserModal from "@/components/ManageUserModal";


/* ================= STATUS COLOR ================= */
const statusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "inactive":
      return "bg-red-50 text-red-600 ring-red-600/20";
    case "pending":
      return "bg-yellow-50 text-yellow-600 ring-yellow-600/20";
    default:
      return "bg-green-50 text-green-600 ring-green-600/20";
  }
};

export default function AllUsersPage() {
  const { token } = useFirebaseAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  /* ================= LOAD USERS ================= */

  const loadUsers = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to load users");
      }

      // ✅ ensure firebase UID exists
      setUsers(
        Array.isArray(json.users)
          ? json.users.filter((u) => u.userId)
          : []
      );
    } catch (err) {
      console.error("LOAD USERS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  /* ================= FILTER ================= */

  const filteredUsers = useMemo(() => {
    if (!search) return users;

    const q = search.toLowerCase();

    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.userId?.toLowerCase().includes(q)
    );
  }, [search, users]);

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          User Management
        </h1>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <button
            disabled
            title="CSV export coming soon"
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-gray-400 cursor-not-allowed"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="4" className="px-5 py-6 text-center text-gray-400">
                  Loading users...
                </td>
              </tr>
            )}

            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan="4" className="px-5 py-6 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            )}

            {!loading &&
              filteredUsers.map((u) => (
                <tr
                  key={u.userId}   // ✅ Firebase UID
                  className="border-t hover:bg-gray-50 transition"
                >
                  {/* USER */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.photo || "https://i.ibb.co/kgp65LMf/profile-avater.png"}
                        className="w-9 h-9 rounded-full"
                        alt=""
                      />
                      <div>
                        <p className="font-medium text-gray-800">
                          {u.name || "Unnamed"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                      <Shield size={12} />
                      {u.role || "user"}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusColor(
                        u.status || "active"
                      )}`}
                    >
                      {u.status || "Active"}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="p-2.5 text-black bg-gray-100 rounded-lg hover:bg-gray-200"
                        title="Manage user"
                      >
                        <Shield size={16} />
                      </button>

                      <button
                        disabled
                        title="Delete disabled"
                        className="p-2.5 text-red-400 bg-red-50 rounded-lg cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selectedUser && (
        <ManageUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={loadUsers}
        />
      )}
    </div>
  );
}
