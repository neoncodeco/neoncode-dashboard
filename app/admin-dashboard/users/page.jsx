"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Shield, Trash2, Download, UserCheck, UserX, Clock, Users } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import ManageUserModal from "@/components/ManageUserModal";

/* ================= STATUS COLOR ================= */
const statusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "inactive":
      return "bg-red-50 text-red-600 ring-red-600/20 border-red-100";
    case "pending":
      return "bg-amber-50 text-amber-600 ring-amber-600/20 border-amber-100";
    default:
      return "bg-emerald-50 text-emerald-600 ring-emerald-600/20 border-emerald-100";
  }
};

const roleColor = (role) => {
  switch (role) {
    case "admin":
      return "bg-purple-50 text-purple-600";
    case "team_member":
      return "bg-cyan-50 text-cyan-600";
    default:
      return "bg-blue-50 text-blue-600";
  }
};

export default function AllUsersPage() {
  const { token, user } = useFirebaseAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState("");

  /* ================= LOAD USERS ================= */
  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load users");
      setUsers(Array.isArray(json.users) ? json.users.filter((u) => u.userId) : []);
    } catch (err) {
      console.error("LOAD USERS ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  /* ================= EXPORT CSV FUNCTION ================= */
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;

    const headers = ["Name,Email,Role,Status,Wallet Balance\n"];
    const rows = filteredUsers.map(u => 
      `${u.name || 'Unnamed'},${u.email},${u.role || 'user'},${u.status || 'active'},${u.walletBalance || 0}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `User_List_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleDeleteUser = async (targetUser) => {
    if (!token || !targetUser?.userId) return;

    if (targetUser.userId === user?.uid) {
      window.alert("You cannot delete your own admin account.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${targetUser.email || targetUser.userId}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingUserId(targetUser.userId);

    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: targetUser.userId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to delete user");

      if (selectedUser?.userId === targetUser.userId) {
        setSelectedUser(null);
      }

      await loadUsers();
    } catch (err) {
      window.alert(err.message || "Failed to delete user");
    } finally {
      setDeletingUserId("");
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#fcfcfc] p-4 pt-20 sm:p-6 sm:pt-20 md:p-8 md:pt-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">User Management</h1>
          <p className="text-gray-500 mt-1">Manage, monitor and export your system users.</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="group relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-black focus:outline-none focus:ring-4 focus:ring-black/5 sm:w-72"
            />
          </div>

          <button
            onClick={handleExportCSV}
            disabled={loading || filteredUsers.length === 0}
            className="admin-accent-button flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest">User Details</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest">Role & Permissions</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-right">Management</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-400 font-medium">Fetching users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                        <Users size={40} className="text-gray-200" />
                        <p className="font-medium">No users found matching your search</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.userId}
                    className="group hover:bg-gray-50/80 transition-all cursor-pointer"
                    onClick={() => setSelectedUser(u)}
                  >
                    {/* USER DETAILS */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                            <img
                              src={u.photo || "https://i.ibb.co/kgp65LMf/profile-avater.png"}
                              className="w-11 h-11 rounded-full border-2 border-white shadow-sm object-cover"
                              alt={u.name ? `${u.name} avatar` : "User avatar"}
                            />
                            <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#132546] ${u.status === 'inactive' ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-black transition-colors">
                            {u.name || "Unnamed"}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${roleColor(u.role)}`}>
                            <Shield size={14} />
                        </div>
                        <span className="text-sm font-bold text-gray-700 capitalize">
                          {u.role || "user"}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-tight border ${statusColor(u.status || "active")}`}>
                        {u.status === 'inactive' ? <UserX size={12}/> : u.status === 'pending' ? <Clock size={12}/> : <UserCheck size={12}/>}
                        {u.status || "Active"}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(u);
                          }}
                          className="admin-secondary-button flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
                        >
                          <Shield size={14} /> Open Profile
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(u);
                          }}
                          disabled={deletingUserId === u.userId || u.userId === user?.uid}
                          className="p-2 text-red-300 transition-colors hover:text-red-200 disabled:cursor-not-allowed disabled:text-red-900/40"
                          title={u.userId === user?.uid ? "You cannot delete your own account" : "Delete user"}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
