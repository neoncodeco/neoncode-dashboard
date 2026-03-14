"use client";
import React from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  Users, 
  FolderKanban,
  CheckCircle2,
  Clock
} from 'lucide-react';

// --- ডামি প্রজেক্ট ডাটা ---
const projectsData = [
  {
    id: 1,
    title: "Website Redesign",
    client: "Neon Code",
    status: "In Progress",
    deadline: "Dec 24, 2023",
    progress: 75,
    team: ["/user1.png", "/user2.png", "/user3.png"], // ইমেজ না থাকলে ডিফল্ট কালার দেখাবে
    color: "bg-blue-500"
  },
  {
    id: 2,
    title: "Mobile App Development",
    client: "Tech Comm",
    status: "Pending",
    deadline: "Jan 10, 2024",
    progress: 15,
    team: ["/user4.png", "/user5.png"],
    color: "bg-orange-500"
  },
  {
    id: 3,
    title: "Marketing Dashboard",
    client: "Global Corp",
    status: "Completed",
    deadline: "Nov 30, 2023",
    progress: 100,
    team: ["/user1.png"],
    color: "bg-emerald-500"
  },
  {
    id: 4,
    title: "E-commerce Platform",
    client: "Shopify Store",
    status: "In Progress",
    deadline: "Feb 15, 2024",
    progress: 45,
    team: ["/user2.png", "/user3.png", "/user5.png", "/user1.png"],
    color: "bg-purple-500"
  },
  {
    id: 5,
    title: "Brand Identity",
    client: "Coffee House",
    status: "Review",
    deadline: "Dec 05, 2023",
    progress: 90,
    team: ["/user4.png"],
    color: "bg-pink-500"
  },
];

export default function ProjectsPage() {
  
  // স্ট্যাটাস অনুযায়ী ব্যাজের কালার
  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      
      {/* --- ১. হেডার সেকশন --- */}
      {/* pt-16 মোবাইলের জন্য, md:pt-0 ডেস্কটপের জন্য */}
      <div className="pt-16 md:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track all your ongoing projects.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* সার্চ বার */}
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search projects..." 
                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 w-full md:w-64"
                />
            </div>
            
            {/* নতুন প্রজেক্ট বাটন (#D8FF30) */}
            <button className="flex items-center justify-center gap-2 bg-[#D8FF30] hover:bg-[#cbf028] text-black font-bold px-5 py-2 rounded-xl text-sm transition shadow-sm">
                <Plus size={18} /> New Project
            </button>
        </div>
      </div>

      {/* --- ২. প্রজেক্ট গ্রিড --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectsData.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                
                {/* কার্ড হেডার */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${project.color}`}>
                            <FolderKanban size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg group-hover:text-green-700 transition-colors">{project.title}</h3>
                            <p className="text-xs text-gray-400">{project.client}</p>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={20} />
                    </button>
                </div>

                {/* স্ট্যাটাস এবং ডেট */}
                <div className="flex justify-between items-center mb-6">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                        <Calendar size={14} /> {project.deadline}
                    </div>
                </div>

                {/* প্রোগ্রেস বার */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${project.color}`} 
                            style={{ width: `${project.progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* ফুটার (টিম মেম্বারস) */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <div className="flex -space-x-2">
                        {project.team.map((img, index) => (
                           <div key={index} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden">
                               {/* ছবি না থাকলে নামের প্রথম অক্ষর দেখাবে, এখানে জাস্ট প্লেসহোল্ডার */}
                               <span className="text-gray-600">U{index+1}</span> 
                           </div> 
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] text-gray-400">
                            +
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-400 text-xs font-medium cursor-pointer hover:text-green-600">
                        View Details
                    </div>
                </div>

            </div>
        ))}

        {/* --- নতুন প্রজেক্ট অ্যাড করার কার্ড (অপশনাল) --- */}
        <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-green-400 hover:bg-green-50/20 transition group min-h-[250px]">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-3 group-hover:bg-[#D8FF30] group-hover:text-black transition-colors">
                <Plus size={28} />
            </div>
            <h3 className="font-bold text-gray-600">Create New Project</h3>
            <p className="text-xs text-gray-400 mt-1">Start something new</p>
        </div>

      </div>
    </div>
  );
}