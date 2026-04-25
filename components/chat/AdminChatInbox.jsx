"use client";

import useAppAuth from "@/hooks/useAppAuth";
import { useCallback, useEffect, useState } from "react";
import { Search, MessageSquare, User as UserIcon, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminChatInbox({ onSelect, selectedChatId }) {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { token } = useAppAuth();

  // ১. চ্যাট লিস্ট ফেচ করা (যেখানে এখন userName এবং userImage আসবে)
  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/chat/list", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch chats");

      const data = await res.json();
      setChats(data.chats || []);
    } catch (err) {
      console.error("Chat fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000); 
    return () => clearInterval(interval);
  }, [fetchChats]);

  // সময় ফরম্যাট করার ফাংশন
  const formatTime = (updatedAt) => {
    if (!updatedAt) return "Just now";
    try {
      let date;
      if (updatedAt.seconds) {
        date = new Date(updatedAt.seconds * 1000);
      } else {
        date = new Date(updatedAt);
      }
      if (isNaN(date.getTime())) return "Recently";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Recently";
    }
  };

  // সার্চ ফিল্টার (এখন নাম দিয়েও সার্চ হবে)
  const filteredChats = chats.filter(chat => 
    (chat.userName || chat.guestName || chat.userId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50 dark:bg-[#0d1730]">
      
      {/* --- Header & Search --- */}
      <div className="flex-none border-b border-slate-200 bg-white p-4 dark:border-[#22375d] dark:bg-[#0f1d38]">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-[#f5f8ff]">Inbox</h2>
          {loading && <Loader2 size={16} className="animate-spin text-sky-600 dark:text-[#8ab4ff]" />}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400" size={16} />
          <input 
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-inner transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-[#2c4167] dark:bg-[#132546] dark:text-[#f5f8ff] dark:focus:border-[#8ab4ff] dark:focus:ring-[#8ab4ff]/20"
          />
        </div>
      </div>

      {/* --- Chat List --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.length === 0 && !loading ? (
          <div className="flex h-48 flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-[#9fb3de]">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 dark:bg-[#132546]">
               <MessageSquare size={30} className="opacity-40" />
            </div>
            <p className="text-sm font-bold">No conversations found</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = selectedChatId === chat.chatId;
            return (
              <div
                key={chat.chatId}
                onClick={() => onSelect(chat)}
                className={`
                  relative flex items-center gap-3 border-b border-slate-200 p-4 transition-all duration-200 dark:border-[#1f3155]
                  ${isActive ? "border-r-4 border-r-sky-500 bg-sky-50 dark:border-r-[#8ab4ff] dark:bg-[#132546]" : "bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-[#101c37]"}
                `}
              >
                {/* User Avatar */}
                <div className="relative flex-none">
                  {chat.userImage ? (
                    <img 
                      src={chat.userImage} 
                      className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm dark:border-[#132546]" 
                      alt="user" 
                    />
                  ) : (
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-white shadow-sm dark:border-[#132546] ${isActive ? 'bg-sky-500 text-white dark:bg-[#8ab4ff] dark:text-[#081227]' : 'bg-slate-200 text-slate-700 dark:bg-[#203963] dark:text-[#dce8ff]'}`}>
                      <UserIcon size={22} />
                    </div>
                  )}
                  {/* Online Status Dot */}
                  <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-sm dark:border-[#132546]"></div>
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    {/* ইউজার আইডি-র বদলে নাম দেখানো হচ্ছে */}
                    <h3 className={`truncate text-sm font-extrabold ${isActive ? 'text-sky-600 dark:text-[#8ab4ff]' : 'text-slate-900 dark:text-[#f5f8ff]'}`}>
                      {chat.userName || chat.guestName || "Guest User"}
                    </h3>
                    <span className="ml-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-tighter text-slate-400 dark:text-[#7f96c7]">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`truncate text-[12px] ${isActive ? 'text-sky-700 dark:text-[#c7d9ff]' : 'text-slate-500 dark:text-[#9fb3de]'}`}>
                      <span className="font-bold mr-1">
                        {chat.lastSender === 'user' ? 'User:' : 'You:'}
                      </span>
                      {chat.lastMessage || "Attachment sent"}
                    </p>
                    
                    {/* Unread Indicator (যদি থাকে) */}
                    {chat.unreadForAdmin > 0 && (
                       <span className="ml-2 rounded-full bg-[#8ab4ff] px-1.5 py-0.5 text-[9px] font-black text-[#081227]">
                          {chat.unreadForAdmin}
                       </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
