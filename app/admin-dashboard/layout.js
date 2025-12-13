"use client";
import AdminSidebar from '@/components/AdminSidebar';
import React from 'react';


export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen w-full bg-[#111827] overflow-hidden">
      
    
      <AdminSidebar />

      {/* ২. ডান পাশে ডায়নামিক কন্টেন্ট */}
      <div className="flex-1 h-full overflow-y-auto bg-gray-50 text-black">
        {children}
      </div>

    </div>
  );
}