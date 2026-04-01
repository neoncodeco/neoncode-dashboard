"use client";

import { useState } from "react";
import AdminChatInbox from "@/components/chat/AdminChatInbox";
import AdminChatWindow from "@/components/chat/AdminChatWindow";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default function AdminChatsPage() {
  const [activeChat, setActiveChat] = useState(null);

  const handleBackToInbox = () => setActiveChat(null);

  return (
    <div className="m-0 flex h-[calc(100vh-4.5rem)] overflow-hidden border border-slate-200 bg-white pt-16 shadow-sm shadow-slate-200/60 lg:m-2 lg:h-[calc(100vh-20px)] lg:rounded-2xl lg:pt-0 xl:m-4 dark:border-[#22375d] dark:bg-[#0f1d38] dark:shadow-black/20">
      
      {/* --- LEFT SIDE: Inbox --- */}
      {/* ১. activeChat থাকলে lg (১০২৪ পিক্সেল) এর নিচে এটি hidden থাকবে।
          ২. চ্যাট না থাকলে এটি 'flex-1' হবে (অর্থাৎ পুরো জায়গা নিবে)।
          ৩. লার্জ স্ক্রিনে (lg) এটি নির্দিষ্ট উইডথ (lg:w-80) নিবে।
      */}
      <div className={`
        ${activeChat ? "hidden lg:flex" : "flex flex-1 lg:flex-none"} 
        lg:w-80 xl:w-96 min-w-0 flex-col border-r border-slate-200 bg-slate-50 dark:border-[#22375d] dark:bg-[#0d1730]
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
        relative min-w-0 flex-col bg-white dark:bg-[#0f1d38]
      `}>
        {activeChat ? (
          <>
            {/* Mobile & Tablet Header (lg পর্যন্ত ব্যাক বাটন থাকবে) */}
            <div className="lg:hidden flex min-w-0 shrink-0 items-center border-b border-slate-200 bg-white p-4 dark:border-[#22375d] dark:bg-[#0f1d38]">
              <button 
                onClick={handleBackToInbox}
                className="-ml-2 rounded-full p-2 text-sky-600 transition-colors hover:bg-sky-50 dark:text-[#8ab4ff] dark:hover:bg-[#132546]"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="ml-2 min-w-0">
                <p className="truncate text-sm font-bold leading-none text-slate-900 dark:text-[#f5f8ff]">
                  {activeChat.guestName || "Guest User"}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Active</p>
              </div>
            </div>

            <AdminChatWindow
              chatId={activeChat.chatId}
              userId={activeChat.userId}
            />
          </>
        ) : (
          /* Empty State - শুধুমাত্র লার্জ স্ক্রিনে আসবে, তাই মিডিয়াম ডিভাইসে গ্যাপ হওয়ার সুযোগ নেই */
          <div className="hidden h-full flex-col items-center justify-center bg-white lg:flex dark:bg-[#0f1d38]">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-sky-50 shadow-sm dark:border-[#22375d] dark:bg-[#132546]">
              <MessageSquare size={40} className="text-sky-600 dark:text-[#8ab4ff]" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-[#f5f8ff]">Your Inbox</h3>
            <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-slate-500 dark:text-[#9fb3de]">
              Select a message from the left to start replying to your customers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
