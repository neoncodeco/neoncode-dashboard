"use client";
import React, { useState } from 'react';
import { 
  Camera, 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Check, 
} from 'lucide-react';

export default function AddAccountPage() {
  const [role, setRole] = useState('Member');
  const [permissions, setPermissions] = useState({
    dashboard: true,
    projects: true,
    tasks: true,
    payments: false,
  });

  // টগল পারমিশন ফাংশন
  const togglePermission = (key) => {
    setPermissions({ ...permissions, [key]: !permissions[key] });
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      
      {/* --- ১. হেডার সেকশন --- */}
      <div className="pt-16 md:pt-0">
        <h1 className="text-2xl font-bold text-gray-800">Add New Account</h1>
        <p className="text-gray-500 text-sm mt-1">Create a new user profile and assign permissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- ২. বাম পাশ: প্রোফাইল ছবি আপলোড --- */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 group cursor-pointer">
                    <div className="w-full h-full rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group-hover:border-green-400 transition-colors">
                        <User size={48} className="text-gray-300 group-hover:text-green-400 transition" />
                    </div>
                    <div className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full shadow-lg cursor-pointer hover:bg-gray-800 transition">
                        <Camera size={16} />
                    </div>
                </div>
                <h3 className="font-bold text-gray-700">Profile Photo</h3>
                <p className="text-xs text-gray-400 mt-1">Upload a photo for the user profile.</p>
            </div>

            {/* রোল সিলেকশন কার্ড */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <label className="text-sm font-bold text-gray-700 mb-3 block">Account Role</label>
                <div className="space-y-2">
                    {['Admin', 'Manager', 'Member'].map((r) => (
                        <div 
                            key={r}
                            onClick={() => setRole(r)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                role === r 
                                ? 'border-green-500 bg-green-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <span className={`text-sm font-medium ${role === r ? 'text-green-700' : 'text-gray-600'}`}>{r}</span>
                            {role === r && <Check size={16} className="text-green-600" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- ৩. ডান পাশ: ইনফরমেশন ফর্ম --- */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* পার্সোনাল ইনফো */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="John" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Doe" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                    <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="email" placeholder="john.doe@example.com" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Confirm Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:bg-white transition" />
                        </div>
                    </div>
                </div>
            </div>

            {/* অ্যাক্সেস কন্ট্রোল (পারমিশন) */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3">Access Permissions</h3>
                
                <div className="space-y-3">
                    {Object.keys(permissions).map((key) => (
                        <div key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-700 capitalize">{key} Access</p>
                                    <p className="text-xs text-gray-400">Allow user to view and edit {key}.</p>
                                </div>
                            </div>
                            
                            {/* টগল বাটন */}
                            <div 
                                onClick={() => togglePermission(key)}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${permissions[key] ? 'bg-black' : 'bg-gray-200'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${permissions[key] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* অ্যাকশন বাটনস */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-4 pt-4">
                <button className="w-full md:w-auto px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition">
                    Cancel
                </button>
                <button className="w-full md:w-auto px-8 py-3 rounded-xl text-sm font-bold text-black bg-[#D8FF30] hover:bg-[#cbf028] shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5">
                    Add Account
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}