"use client";

import { useEffect, useMemo, useState } from "react";
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

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#fcfcfc] min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1">Manage, monitor and export your system users.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10 pr-4 py-2.5 w-full sm:w-72 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all shadow-sm"
            />
          </div>

          <button
            onClick={handleExportCSV}
            disabled={loading || filteredUsers.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
                              alt=""
                            />
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${u.status === 'inactive' ? 'bg-red-500' : 'bg-green-500'}`}></div>
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
                        <div className={`p-1.5 rounded-lg ${u.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
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
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-black  border border-gray-200 rounded-lg hover:border-black hover:shadow-sm transition-all"
                        >
                          <Shield size={14} /> Open Profile
                        </button>

                        <button
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-red-300 hover:text-red-500 transition-colors cursor-not-allowed"
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
