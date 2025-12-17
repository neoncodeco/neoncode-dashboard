"use client";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { X, Headset } from "lucide-react";

export default function ChatWindow({ user, onClose }) {
  const chatId = `support_${user.uid}`;

  return (
    <div className="fixed bottom-2 right-0 sm:right-6 w-[95vw] sm:w-96 h-[500px] md:h-[580px] bg-[#214311] rounded-2xl shadow-2xl flex flex-col z-[60]  overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      
      {/* --- Header: Fixed Height --- */}
      <div className="flex-none p-4 border-b bg-[#214311] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-blue-50 rounded-full text-blue-600">
              <Headset size={24} />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-tight">Live Support</h3>
            <p className="text-xs text-green-600 font-medium">Online</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-white">
          <X size={20} />
        </button>
      </div>

      {/* --- Message Area: Scrollable (Main Fix) --- */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-2 custom-scrollbar">
        <ChatMessages chatId={chatId} />
      </div>

      {/* --- Input Area: Fixed at Bottom --- */}
      <div className="flex-none p-3 bg-[#214311]">
        <ChatInput chatId={chatId} user={user} />
      </div>
    </div>
  );
}