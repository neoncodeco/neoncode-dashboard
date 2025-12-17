"use client";

import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useEffect, useState } from "react";
import { Search, MessageSquare, Clock, User as UserIcon, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminChatInbox({ onSelect, selectedChatId }) {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { token } = useFirebaseAuth();

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
    const interval = setInterval(fetchChats, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, [token]);

  // Safe Time Formatter Function
  const formatTime = (updatedAt) => {
    if (!updatedAt) return "Just now";
    try {
      let date;
      // Handle Firebase Timestamp {seconds: ...}
      if (updatedAt.seconds) {
        date = new Date(updatedAt.seconds * 1000);
      } 
      // Handle ISO String or Number
      else {
        date = new Date(updatedAt);
      }

      // Check if date is valid before formatting
      if (isNaN(date.getTime())) return "Recently";
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Recently";
    }
  };

  const filteredChats = chats.filter(chat => 
    (chat.guestName || chat.userId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full md:w-80 border-r border-gray-200 h-full flex flex-col bg-white overflow-hidden">
      {/* --- Sidebar Header --- */}
      <div className="p-4 border-b border-gray-100 flex-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inbox</h2>
          {loading && <Loader2 size={16} className="animate-spin text-indigo-500" />}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-black"
          />
        </div>
      </div>

      {/* --- Chat List Area --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {filteredChats.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-center p-6 text-gray-400">
            <MessageSquare size={32} className="mb-2 opacity-20" />
            <p className="text-sm">No active conversations</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = selectedChatId === chat.chatId;
            return (
              <div
                key={chat.chatId}
                onClick={() => onSelect(chat)}
                className={`
                  p-4 cursor-pointer transition-all duration-200 border-b border-gray-50 flex gap-3 relative
                  ${isActive ? "bg-indigo-50/70 border-r-4 border-r-indigo-600" : "hover:bg-gray-50"}
                `}
              >
                {/* Avatar with Status */}
                <div className="relative flex-none">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <UserIcon size={22} />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-sm font-bold truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {chat.guestName || chat.userId?.slice(0, 8) || "Guest User"}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  
                  <p className={`text-xs truncate mt-1 ${isActive ? 'text-indigo-700/70' : 'text-gray-500'}`}>
                    {chat.lastSender === 'user' ? 'User: ' : 'You: '}
                    {chat.lastMessage || "Click to open chat"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Status */}
    </div>
  );
}