"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, // Projects এর জন্য
  Banknote,     // Payments এর জন্য
  LifeBuoy,     // Support এর জন্য
  Share2,       // Affiliate এর জন্য
  Settings, 
  LogOut, 
  ShieldCheck,
  Menu, 
  X
} from 'lucide-react';

const AdminSidebar = () => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // --- অ্যাডমিন মেনু (User Dashboard এর ফিচার কন্ট্রোল করার জন্য) ---
  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, href: '/admin-dashboard/overview' },
    { name: 'All Users', icon: Users, href: '/admin-dashboard/users' },
    { name: 'Manage Projects', icon: FolderKanban, href: '/admin-dashboard/projects' },
    { name: 'Transactions', icon: Banknote, href: '/admin-dashboard/transactions' },
    { name: 'Support Inbox', icon: LifeBuoy, href: '/admin-dashboard/support' },
    { name: 'Affiliate Payouts', icon: Share2, href: '/admin-dashboard/affiliates' },
    { name: 'Settings', icon: Settings, href: '/admin-dashboard/settings' },
  ];

  const renderMenu = () => (
    <nav className="space-y-2">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.name} 
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
          >
            <div className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                isActive 
                ? 'bg-[#D8FF30] text-black font-bold shadow-md' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}>
              <item.icon size={20} />
              <span className="text-sm">{item.name}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-[#111827] z-50 border-b border-gray-800 px-4 py-3 flex justify-between items-center shadow-md">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Image src="/Neon Studio icon.png" alt="Admin Logo" width={20} height={20} priority />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">NEON ADMIN</span>
         </div>
         
         <button onClick={() => setIsMobileOpen(true)} className="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition">
           <Menu size={24} />
         </button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}></div>
          
          <div className="absolute top-0 left-0 w-[80%] max-w-sm h-full bg-[#111827] shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 border-r border-gray-800">
             <div>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                           <Image src="/Neon Studio icon.png" alt="Admin Logo" width={24} height={24} priority />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-white tracking-tight block">NEON ADMIN</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded">Control Panel</span>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                {renderMenu()}
             </div>
             <div className="space-y-3 pt-6 border-t border-gray-800">
                <div className="flex items-center gap-3 px-4 text-gray-400 cursor-pointer hover:text-white text-sm transition-colors"><ShieldCheck size={18} /> Admin Profile</div>
                <div className="flex items-center gap-3 px-4 text-gray-400 cursor-pointer hover:text-red-400 text-sm transition-colors"><LogOut size={18} /> Logout</div>
             </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="md:w-64 xl:w-72 bg-[#111827] min-h-screen flex-col justify-between p-6 hidden md:flex border-r border-gray-800 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                 <Image src="/Neon Studio icon.png" alt="Admin Logo" width={24} height={24} className="object-contain" priority />
              </div>
              <div>
                  <span className="text-xl font-bold text-white tracking-tight block">NEON ADMIN</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-800 px-2 py-0.5 rounded">Control Panel</span>
              </div>
          </div>

          {renderMenu()}
        </div>

        <div className="space-y-3 pt-6 border-t border-gray-800">
           <div className="flex items-center gap-3 px-4 text-gray-400 cursor-pointer hover:text-white text-sm transition-colors">
              <ShieldCheck size={18} /> Admin Profile
           </div>
           <div className="flex items-center gap-3 px-4 text-gray-400 cursor-pointer hover:text-red-400 text-sm transition-colors">
              <LogOut size={18} /> Logout
           </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;