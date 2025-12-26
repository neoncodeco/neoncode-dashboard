"use client";

import { useState } from "react";
import AdminChatInbox from "@/components/chat/AdminChatInbox";
import AdminChatWindow from "@/components/chat/AdminChatWindow";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default function AdminChatsPage() {
  const [activeChat, setActiveChat] = useState(null);

  const handleBackToInbox = () => setActiveChat(null);

  return (
    <div className="flex h-[calc(100vh-20px)] bg-white rounded-2xl shadow-sm border pt-16 md:pt-0 border-gray-100 overflow-hidden m-2 md:m-4">
      
      {/* --- LEFT SIDE: Inbox --- */}
      {/* ১. activeChat থাকলে lg (১০২৪ পিক্সেল) এর নিচে এটি hidden থাকবে।
          ২. চ্যাট না থাকলে এটি 'flex-1' হবে (অর্থাৎ পুরো জায়গা নিবে)।
          ৩. লার্জ স্ক্রিনে (lg) এটি নির্দিষ্ট উইডথ (lg:w-80) নিবে।
      */}
      <div className={`
        ${activeChat ? "hidden lg:flex" : "flex flex-1 lg:flex-none"} 
        lg:w-80 xl:w-96 flex-col border-r border-gray-100 bg-slate-50/20
      `}>
        <AdminChatInbox 
          onSelect={setActiveChat} 
          selectedChatId={activeChat?.chatId} 
        />
      </div>

      {/* --- RIGHT SIDE: Chat Window --- */}
      {/* ১. চ্যাট সিলেক্ট না হলে lg এর নিচে এই কলামটি অস্তিত্বহীন (hidden) থাকবে।
          ২. ফলে বাম পাশের ইনবক্স পুরো জায়গা দখল করতে বাধ্য হবে।
      */}
      <div className={`
        ${activeChat ? "flex flex-1" : "hidden lg:flex lg:flex-1"} 
        flex-col bg-white relative
      `}>
        {activeChat ? (
          <>
            {/* Mobile & Tablet Header (lg পর্যন্ত ব্যাক বাটন থাকবে) */}
            <div className="lg:hidden flex items-center p-4 border-b bg-white shrink-0">
              <button 
                onClick={handleBackToInbox}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-indigo-600 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="ml-2">
                <p className="text-sm font-bold text-slate-800 leading-none">
                  {activeChat.guestName || "Guest User"}
                </p>
                <p className="text-[10px] text-green-500 font-bold uppercase mt-1 tracking-wider">Active</p>
              </div>
            </div>

            <AdminChatWindow
              chatId={activeChat.chatId}
              userId={activeChat.userId}
            />
          </>
        ) : (
          /* Empty State - শুধুমাত্র লার্জ স্ক্রিনে আসবে, তাই মিডিয়াম ডিভাইসে গ্যাপ হওয়ার সুযোগ নেই */
          <div className="hidden lg:flex flex-col items-center justify-center h-full bg-slate-50/30">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-gray-50">
              <MessageSquare size={40} className="text-indigo-200" />
            </div>
            <h3 className="text-slate-800 font-bold text-lg tracking-tight">Your Inbox</h3>
            <p className="text-slate-400 text-sm max-w-xs text-center mt-2 leading-relaxed">
              Select a message from the left to start replying to your customers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}