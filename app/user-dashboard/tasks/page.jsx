"use client";
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle,
  MoreHorizontal,
  Filter,
  Flag
} from 'lucide-react';

// --- ডামি টাস্ক ডাটা ---
const allTasksData = [
  {
    id: 1,
    title: "Design Homepage Hero Section",
    project: "Website Redesign",
    priority: "High",
    status: "In Progress",
    dueDate: "Today",
    time: "4h left",
    assignee: "U1", // ইমেজ না থাকলে ইনিশিয়াল
  },
  {
    id: 2,
    title: "Fix Navigation Bug on Mobile",
    project: "Mobile App",
    priority: "High",
    status: "Pending",
    dueDate: "Tomorrow",
    time: "1d left",
    assignee: "U2",
  },
  {
    id: 3,
    title: "Write Documentation for API",
    project: "Backend System",
    priority: "Medium",
    status: "Completed",
    dueDate: "Yesterday",
    time: "Done",
    assignee: "U3",
  },
  {
    id: 4,
    title: "Create Social Media Assets",
    project: "Marketing",
    priority: "Low",
    status: "In Progress",
    dueDate: "Dec 20",
    time: "2d left",
    assignee: "U1",
  },
  {
    id: 5,
    title: "Client Meeting Preparation",
    project: "General",
    priority: "Medium",
    status: "Pending",
    dueDate: "Dec 22",
    time: "3d left",
    assignee: "U4",
  },
];

export default function TasksPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [tasks, setTasks] = useState(allTasksData);

  // প্রায়োরিটি অনুযায়ী কালার সেট করা
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Medium': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Low': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // ফিল্টার লজিক
  const filteredTasks = activeFilter === 'All' 
    ? tasks 
    : tasks.filter(task => task.status === activeFilter);

  // টাস্ক স্ট্যাটাস টগল
  const toggleStatus = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'Completed' ? 'In Progress' : 'Completed' } : t));
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* --- ১. হেডার সেকশন --- */}
      <div className="pt-16 md:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">Check your daily to-do list.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* সার্চ বার */}
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 w-full md:w-64"
                />
            </div>
            
            {/* নতুন টাস্ক বাটন (#D8FF30) */}
            <button className="flex items-center justify-center gap-2 bg-[#D8FF30] hover:bg-[#cbf028] text-black font-bold px-5 py-2 rounded-xl text-sm transition shadow-sm">
                <Plus size={18} /> Add Task
            </button>
        </div>
      </div>

      {/* --- ২. ফিল্টার ট্যাব --- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', 'In Progress', 'Pending', 'Completed'].map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    activeFilter === tab 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
            >
                {tab}
            </button>
        ))}
      </div>

      {/* --- ৩. টাস্ক লিস্ট --- */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
            <div 
                key={task.id} 
                className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-green-300 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
                {/* বাম পাশ: চেক বক্স এবং টাইটেল */}
                <div className="flex items-start gap-4 w-full md:w-auto">
                    <button 
                        onClick={() => toggleStatus(task.id)}
                        className={`mt-1 md:mt-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            task.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                    >
                        {task.status === 'Completed' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                    
                    <div>
                        <h3 className={`font-bold text-gray-800 transition-all ${task.status === 'Completed' ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                           <span className="bg-gray-50 px-2 py-0.5 rounded text-gray-500">{task.project}</span>
                        </p>
                    </div>
                </div>

                {/* ডান পাশ: ইনফরমেশন এবং অ্যাকশন */}
                <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 pl-10 md:pl-0">
                    
                    {/* প্রায়োরিটি ব্যাজ */}
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                        <Flag size={12} />
                        {task.priority}
                    </div>

                    {/* ডেট এবং সময় */}
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span className={task.dueDate === 'Today' ? 'text-red-500 font-bold' : ''}>{task.dueDate}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1">
                            <Clock size={14} />
                            <span>{task.time}</span>
                        </div>
                    </div>

                    {/* অ্যাসাইনি */}
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                        {task.assignee}
                    </div>

                    {/* অপশন মেনু */}
                    <button className="text-gray-300 hover:text-black transition">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>
        ))}

        {/* যদি কোনো টাস্ক না থাকে */}
        {filteredTasks.length === 0 && (
            <div className="text-center py-10 text-gray-400">
                <p>No tasks found in this category.</p>
            </div>
        )}
      </div>

    </div>
  );
}