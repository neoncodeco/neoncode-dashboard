"use client";

import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useCallback, useEffect, useState } from "react";
import { Search, MessageSquare, User as UserIcon, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminChatInbox({ onSelect, selectedChatId }) {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { token } = useFirebaseAuth();

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
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0d1730]">
      
      {/* --- Header & Search --- */}
      <div className="flex-none border-b border-[#22375d] bg-[#0f1d38] p-4">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-black tracking-tight text-[#f5f8ff]">Inbox</h2>
          {loading && <Loader2 size={16} className="animate-spin text-[#8ab4ff]" />}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[#2c4167] bg-[#132546] py-2.5 pl-10 pr-4 text-sm text-[#f5f8ff] shadow-inner transition-all focus:border-[#8ab4ff] focus:outline-none focus:ring-2 focus:ring-[#8ab4ff]/20"
          />
        </div>
      </div>

      {/* --- Chat List --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.length === 0 && !loading ? (
          <div className="flex h-48 flex-col items-center justify-center p-6 text-center text-[#9fb3de]">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#132546]">
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
                  relative flex items-center gap-3 border-b border-[#1f3155] p-4 transition-all duration-200
                  ${isActive ? "bg-[#132546] border-r-4 border-r-[#8ab4ff]" : "hover:bg-[#101c37]"}
                `}
              >
                {/* User Avatar */}
                <div className="relative flex-none">
                  {chat.userImage ? (
                    <img 
                      src={chat.userImage} 
                      className="h-12 w-12 rounded-full border-2 border-[#132546] object-cover shadow-sm" 
                      alt="user" 
                    />
                  ) : (
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#132546] shadow-sm ${isActive ? 'bg-[#8ab4ff] text-[#081227]' : 'bg-[#203963] text-[#dce8ff]'}`}>
                      <UserIcon size={22} />
                    </div>
                  )}
                  {/* Online Status Dot */}
                  <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#132546] bg-emerald-400 shadow-sm"></div>
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    {/* ইউজার আইডি-র বদলে নাম দেখানো হচ্ছে */}
                    <h3 className={`truncate text-sm font-extrabold ${isActive ? 'text-[#8ab4ff]' : 'text-[#f5f8ff]'}`}>
                      {chat.userName || chat.guestName || "Guest User"}
                    </h3>
                    <span className="ml-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-tighter text-[#7f96c7]">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`truncate text-[12px] ${isActive ? 'text-[#c7d9ff]' : 'text-[#9fb3de]'}`}>
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
