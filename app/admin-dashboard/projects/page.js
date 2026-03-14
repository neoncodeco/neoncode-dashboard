"use client";
import React, { useState } from 'react';
import { 
  FolderKanban, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Trash2, 
  Eye, 
  Calendar 
} from 'lucide-react';

// --- ডামি প্রজেক্ট ডাটা ---
const projectsData = [
  { 
    id: '#PRJ-001', 
    name: 'Neon Website Redesign', 
    client: 'Neon Code', 
    team: ['A', 'B', 'C'], 
    progress: 75, 
    status: 'Active', 
    deadline: 'Dec 24, 2023' 
  },
  { 
    id: '#PRJ-002', 
    name: 'Mobile App Development', 
    client: 'Tech Comm', 
    team: ['D', 'E'], 
    progress: 30, 
    status: 'Pending', 
    deadline: 'Jan 15, 2024' 
  },
  { 
    id: '#PRJ-003', 
    name: 'Marketing Dashboard', 
    client: 'Global Corp', 
    team: ['F'], 
    progress: 100, 
    status: 'Completed', 
    deadline: 'Nov 30, 2023' 
  },
  { 
    id: '#PRJ-004', 
    name: 'E-commerce Platform', 
    client: 'Shopify Store', 
    team: ['G', 'H', 'I'], 
    progress: 50, 
    status: 'Active', 
    deadline: 'Feb 10, 2024' 
  },
];

export default function ManageProjectsPage() {
  const [filter, setFilter] = useState('All');

  // স্ট্যাটাস কালার
  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      
      {/* --- ১. হেডার সেকশন --- */}
      <div className="pt-12 md:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Projects</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all ongoing projects.</p>
        </div>
        
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                <Filter size={16} /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#D8FF30] text-black rounded-lg text-sm font-bold hover:bg-[#cbf028] transition shadow-sm">
                <FolderKanban size={16} /> Create Project
            </button>
        </div>
      </div>

      {/* --- ২. প্রজেক্ট টেবিল --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* টেবিল হেডার */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                        <th className="p-4 pl-6">Project Name</th>
                        <th className="p-4">Team</th>
                        <th className="p-4">Progress</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Deadline</th>
                        <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {projectsData.map((project, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition group last:border-none">
                            
                            {/* প্রজেক্ট নাম ও ক্লায়েন্ট */}
                            <td className="p-4 pl-6">
                                <p className="font-bold text-gray-900">{project.name}</p>
                                <p className="text-xs text-gray-500">{project.client} • {project.id}</p>
                            </td>

                            {/* টিম মেম্বারস */}
                            <td className="p-4">
                                <div className="flex -space-x-2">
                                    {project.team.map((t, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">
                                            {t}
                                        </div>
                                    ))}
                                </div>
                            </td>

                            {/* প্রোগ্রেস বার */}
                            <td className="p-4 w-40">
                                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                    <span>{project.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${project.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </td>

                            {/* স্ট্যাটাস */}
                            <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                            </td>

                            {/* ডেডলাইন */}
                            <td className="p-4 text-gray-500 flex items-center gap-2 mt-2">
                                <Calendar size={14} /> {project.deadline}
                            </td>

                            {/* অ্যাকশন বাটন */}
                            <td className="p-4 text-right pr-6">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="View Details">
                                        <Eye size={16} />
                                    </button>
                                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Project">
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
            <span>Showing 4 of 12 projects</span>
            <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
                <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
            </div>
        </div>
      </div>

    </div>
  );
}