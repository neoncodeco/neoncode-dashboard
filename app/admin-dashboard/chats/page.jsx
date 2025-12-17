"use client";

import { useState } from "react";
import AdminChatInbox from "@/components/chat/AdminChatInbox";
import AdminChatWindow from "@/components/chat/AdminChatWindow";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default function AdminChatsPage() {
  const [activeChat, setActiveChat] = useState(null);

  // Mobile-e back button-er jonno activeChat reset kora
  const handleBackToInbox = () => setActiveChat(null);

  return (
    <div className="flex h-[calc(100vh-20px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden m-2 md:m-4">
      
      {/* --- LEFT SIDE: Inbox --- */}
      <div className={`
        ${activeChat ? "hidden md:flex" : "flex"} 
        w-full md:w-80 lg:w-96 flex-col border-r border-gray-100 bg-slate-50/20
      `}>
        <AdminChatInbox 
          onSelect={setActiveChat} 
          selectedChatId={activeChat?.chatId} 
        />
      </div>

      {/* --- RIGHT SIDE: Chat Window --- */}
      <div className={`
        ${activeChat ? "flex" : "hidden md:flex"} 
        flex-1 flex-col bg-white relative
      `}>
        {activeChat ? (
          <>
            {/* Mobile Header with Back Button */}
            <div className="md:hidden flex items-center p-4 border-b bg-white">
              <button 
                onClick={handleBackToInbox}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-indigo-600 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="ml-2">
                <p className="text-sm font-bold text-slate-800">
                  {activeChat.guestName || "Guest User"}
                </p>
                <p className="text-[10px] text-green-500 font-bold uppercase">Active</p>
              </div>
            </div>

            <AdminChatWindow
              chatId={activeChat.chatId}
              userId={activeChat.userId}
            />
          </>
        ) : (
          /* Empty State for Desktop */
          <div className="hidden md:flex flex-col items-center justify-center h-full bg-slate-50/30">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-gray-50">
              <MessageSquare size={40} className="text-indigo-200" />
            </div>
            <h3 className="text-slate-800 font-bold text-lg">Your Inbox</h3>
            <p className="text-slate-400 text-sm max-w-xs text-center mt-2">
              Select a message from the left to start replying to your customers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}