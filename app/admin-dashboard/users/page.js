"use client";
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  Download,
  UserPlus
} from 'lucide-react';

// --- ডামি ইউজার ডাটা ---
const usersData = [
  { id: 1, name: 'Alex Johnson', email: 'alex@gmail.com', role: 'Admin', status: 'Active', joined: 'Oct 24, 2023', avatar: 'A' },
  { id: 2, name: 'Sarah Connor', email: 'sarah@tech.io', role: 'Manager', status: 'Active', joined: 'Sep 12, 2023', avatar: 'S' },
  { id: 3, name: 'Mike Ross', email: 'mike.ross@law.com', role: 'Member', status: 'Inactive', joined: 'Aug 05, 2023', avatar: 'M' },
  { id: 4, name: 'Jessica Pearson', email: 'jessica@pearson.com', role: 'Admin', status: 'Active', joined: 'Jul 20, 2023', avatar: 'J' },
  { id: 5, name: 'Harvey Specter', email: 'harvey@specter.com', role: 'Member', status: 'Banned', joined: 'Jun 15, 2023', avatar: 'H' },
];

export default function AllUsersPage() {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // স্ট্যাটাস কালার
  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Inactive': return 'bg-gray-100 text-gray-600';
      case 'Banned': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  // রোল কালার
  const getRoleColor = (role) => {
    switch(role) {
      case 'Admin': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'Manager': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      
      {/* --- ১. হেডার সেকশন --- */}
      <div className="pt-12 md:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage user roles, status, and permissions.</p>
        </div>
        
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                <Download size={16} /> Export CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#D8FF30] text-black rounded-lg text-sm font-bold hover:bg-[#cbf028] transition shadow-sm">
                <UserPlus size={16} /> Add User
            </button>
        </div>
      </div>

      {/* --- ২. ফিল্টার এবং সার্চ --- */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search by name or email..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select 
                className="bg-gray-50 border border-gray-200 text-sm px-3 py-2 rounded-lg outline-none cursor-pointer hover:border-gray-300"
                onChange={(e) => setFilter(e.target.value)}
            >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Member">Member</option>
            </select>
        </div>
      </div>

      {/* --- ৩. ইউজার টেবিল --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                        <th className="p-4 pl-6">User</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Joined Date</th>
                        <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {usersData.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition group last:border-none">
                            
                            {/* নাম এবং ইমেইল */}
                            <td className="p-4 pl-6 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                                    {user.avatar}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </td>

                            {/* রোল */}
                            <td className="p-4">
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border w-fit ${getRoleColor(user.role)}`}>
                                    <Shield size={12} /> {user.role}
                                </span>
                            </td>

                            {/* স্ট্যাটাস */}
                            <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(user.status)}`}>
                                    {user.status}
                                </span>
                            </td>

                            {/* জয়েনিং ডেট */}
                            <td className="p-4 text-gray-500">{user.joined}</td>

                            {/* অ্যাকশন বাটন */}
                            <td className="p-4 text-right pr-6">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                        <Edit size={16} />
                                    </button>
                                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* পেজিনেশন */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
            <span>Showing 1-5 of 24 users</span>
            <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
                <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
            </div>
        </div>
      </div>

    </div>
  );
}