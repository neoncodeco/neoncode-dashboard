"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  Download,
  UserPlus,
  Loader2, // Added for loading state in buttons
} from "lucide-react";
import ManageUserModal from "@/components/ManageUserModal"; // Assuming this component exists
import useFirebaseAuth from "@/hooks/useFirebaseAuth"; // Assuming this hook exists

export default function AllUsersPage() {
  const { token } = useFirebaseAuth();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  /* ---------------- LOAD USERS ---------------- */
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/list", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        // Ensure users array is valid
        setUsers(Array.isArray(json.users) ? json.users : []); 
      } else {
        console.error("Failed to load users:", json.message || "Unknown error");
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadUsers();
  }, [token]);

  /* ---------------- FILTER & SEARCH ---------------- */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Ensure data exists before calling methods
      const name = u.name?.toLowerCase() || '';
      const email = u.email?.toLowerCase() || '';
      const role = u.role?.toLowerCase() || 'user';
      const searchLower = search.toLowerCase();

      const matchSearch =
        name.includes(searchLower) ||
        email.includes(searchLower);

      const matchRole = filter === "All" || role === filter.toLowerCase();

      return matchSearch && matchRole;
    });
  }, [users, search, filter]);

  /* ---------------- ROLE COLORING ---------------- */
  /**
   * ইউজার রোলের উপর ভিত্তি করে Tailwind CSS ক্লাস রিটার্ন করে।
   */
  const roleColor = (role) => {
    const roleLower = role?.toLowerCase();
    if (roleLower === "admin")
      return "text-purple-700 bg-purple-100 ring-purple-600/20";
    if (roleLower === "manager")
      return "text-orange-700 bg-orange-100 ring-orange-600/20";
    // Default or user/member
    return "text-blue-700 bg-blue-100 ring-blue-600/20";
  };
  
  // Example for status badge (Assuming status can be 'active', 'inactive', 'suspended')
  const statusColor = (status) => {
    const statusLower = (status || 'active').toLowerCase();
    if (statusLower === "suspended")
      return "text-red-700 bg-red-100 ring-red-600/20";
    if (statusLower === "inactive")
      return "text-gray-700 bg-gray-100 ring-gray-600/20";
    return "text-green-700 bg-green-100 ring-green-600/20";
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* ================= HEADER & ACTIONS ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user roles, permissions, and status across the platform.
          </p>
        </div>

        <div className="flex gap-3">
          {/* Export Button */}
          <button 
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg flex items-center gap-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 transition duration-150"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* ================= SEARCH & FILTER BAR ================= */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search by name or email"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-gray-500" />
          <select
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            onChange={(e) => setFilter(e.target.value)}
            defaultValue="All"
          >
            <option value="All">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">Member (User)</option>
          </select>
        </div>
      </div>

      {/* ================= USER TABLE ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-100 table-auto">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="p-4 pl-6 text-left font-semibold">User</th>
              <th className="p-4 text-left font-semibold">Role</th>
              <th className="p-4 text-left font-semibold">Status</th>
              <th className="p-4 text-left font-semibold">Joined Date</th>
              <th className="p-4 text-right pr-6 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((u) => (
              <tr
                key={u._id}
                className="hover:bg-gray-50 transition duration-100 group"
              >
                {/* User Info (Name, Email, Photo) */}
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-3">
                    {/* Placeholder for Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 border border-gray-300">
                       {/* You can replace this with an actual <img src={u.photo} /> if photo is available/required */}
                       {u.name ? u.name[0].toUpperCase() : 'U'} 
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 truncate max-w-[150px]">
                        {u.name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">
                        {u.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Role Badge */}
                <td className="p-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${roleColor(u.role)}`}
                  >
                    <Shield size={12} className="mr-1" />
                    {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Member'}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="p-4 capitalize">
                   <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusColor(u.status)}`}
                  >
                    {u.status || "Active"}
                  </span>
                </td>

                {/* Joined Date */}
                <td className="p-4 text-gray-500">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }) : 'N/A'}
                </td>

                {/* Action Buttons */}
                <td className="p-4 text-right pr-6">
                  {/* Action group appears on hover for better focus */}
                  <div className="flex justify-end gap-2"> 
                    <button
                      title="Manage User"
                      onClick={() => setSelectedUser(u)}
                      className="p-2.5 text-white bg-blue-600 flex items-center gap-1 rounded-lg text-xs font-medium hover:bg-blue-700 transition duration-150 shadow-md"
                    >
                      <Edit size={16} /> Manage
                    </button>
                    
                    {/* Delete button (optional, can be moved to modal) */}
                    <button
                       title="Delete User"
                       className="p-2.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition duration-150"
                    >
                       <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* EMPTY STATE */}
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center bg-gray-50">
            <p className="text-base font-medium text-gray-600">
              No users found matching the current criteria.
            </p>
            <p className="text-sm text-gray-400 mt-1">
                Try clearing your search or selecting "All Roles".
            </p>
          </div>
        )}
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