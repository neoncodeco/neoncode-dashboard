"use client";

import { useState } from "react";
import AdminChatInbox from "@/components/chat/AdminChatInbox";
import AdminChatWindow from "@/components/chat/AdminChatWindow";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default function AdminChatsPage() {
  const [activeChat, setActiveChat] = useState(null);

  const handleBackToInbox = () => setActiveChat(null);

  return (
    <div className="m-0 flex h-[calc(100vh-4.5rem)] overflow-hidden border border-[#22375d] bg-[#0f1d38] pt-16 shadow-sm lg:m-2 lg:h-[calc(100vh-20px)] lg:rounded-2xl lg:pt-0 xl:m-4">
      
      {/* --- LEFT SIDE: Inbox --- */}
      {/* ১. activeChat থাকলে lg (১০২৪ পিক্সেল) এর নিচে এটি hidden থাকবে।
          ২. চ্যাট না থাকলে এটি 'flex-1' হবে (অর্থাৎ পুরো জায়গা নিবে)।
          ৩. লার্জ স্ক্রিনে (lg) এটি নির্দিষ্ট উইডথ (lg:w-80) নিবে।
      */}
      <div className={`
        ${activeChat ? "hidden lg:flex" : "flex flex-1 lg:flex-none"} 
        lg:w-80 xl:w-96 min-w-0 flex-col border-r border-[#22375d] bg-[#0d1730]
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
        relative min-w-0 flex-col bg-[#0f1d38]
      `}>
        {activeChat ? (
          <>
            {/* Mobile & Tablet Header (lg পর্যন্ত ব্যাক বাটন থাকবে) */}
            <div className="lg:hidden flex min-w-0 shrink-0 items-center border-b border-[#22375d] bg-[#0f1d38] p-4">
              <button 
                onClick={handleBackToInbox}
                className="-ml-2 rounded-full p-2 text-[#8ab4ff] transition-colors hover:bg-[#132546]"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="ml-2 min-w-0">
                <p className="truncate text-sm font-bold leading-none text-[#f5f8ff]">
                  {activeChat.guestName || "Guest User"}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Active</p>
              </div>
            </div>

            <AdminChatWindow
              chatId={activeChat.chatId}
              userId={activeChat.userId}
            />
          </>
        ) : (
          /* Empty State - শুধুমাত্র লার্জ স্ক্রিনে আসবে, তাই মিডিয়াম ডিভাইসে গ্যাপ হওয়ার সুযোগ নেই */
          <div className="hidden h-full flex-col items-center justify-center bg-[#0f1d38] lg:flex">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#22375d] bg-[#132546] shadow-sm">
              <MessageSquare size={40} className="text-[#8ab4ff]" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-[#f5f8ff]">Your Inbox</h3>
            <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-[#9fb3de]">
              Select a message from the left to start replying to your customers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
