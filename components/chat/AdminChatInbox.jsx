"use client";

import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useEffect, useState } from "react";
import { Search, MessageSquare, User as UserIcon, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminChatInbox({ onSelect, selectedChatId }) {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { token } = useFirebaseAuth();

  // ১. চ্যাট লিস্ট ফেচ করা (যেখানে এখন userName এবং userImage আসবে)
  const fetchChats = async () => {
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
  };
  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000); 
    return () => clearInterval(interval);
  }, [token]);

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
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      
      {/* --- Header & Search --- */}
      <div className="p-4 border-b border-gray-100 flex-none bg-white">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Inbox</h2>
          {loading && <Loader2 size={16} className="animate-spin text-indigo-600" />}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition-all text-black shadow-inner"
          />
        </div>
      </div>

      {/* --- Chat List --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
               <MessageSquare size={30} className="opacity-20" />
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
                  p-4 cursor-pointer transition-all duration-200 border-b border-gray-50 flex gap-3 relative items-center
                  ${isActive ? "bg-indigo-50/80 border-r-4 border-r-indigo-600" : "hover:bg-gray-50"}
                `}
              >
                {/* User Avatar */}
                <div className="relative flex-none">
                  {chat.userImage ? (
                    <img 
                      src={chat.userImage} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                      alt="user" 
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <UserIcon size={22} />
                    </div>
                  )}
                  {/* Online Status Dot */}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    {/* ইউজার আইডি-র বদলে নাম দেখানো হচ্ছে */}
                    <h3 className={`text-sm font-extrabold truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {chat.userName || chat.guestName || "Guest User"}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap ml-2 uppercase tracking-tighter">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-[12px] truncate ${isActive ? 'text-indigo-700/80' : 'text-gray-500'}`}>
                      <span className="font-bold mr-1">
                        {chat.lastSender === 'user' ? 'User:' : 'You:'}
                      </span>
                      {chat.lastMessage || "Attachment sent"}
                    </p>
                    
                    {/* Unread Indicator (যদি থাকে) */}
                    {chat.unreadForAdmin > 0 && (
                       <span className="ml-2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
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