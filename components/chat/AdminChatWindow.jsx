"use client";

import { useEffect } from "react";
import ChatMessages from "./ChatMessages";
import AdminReplyInput from "./AdminReplyInput";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { User, Circle, ShieldCheck } from "lucide-react";

export default function AdminChatWindow({ chatId }) {
  const { token , role } = useFirebaseAuth();

  // 🔔 Admin opens chat → Reset unread status
  useEffect(() => {
    if (!chatId || !token) return;

    fetch("/api/admin/chat/read", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId }),
    }).catch(err => console.error("Error marking as read:", err));
  }, [chatId, token]);

  if (!chatId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 border-l border-gray-100">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
          <User size={40} className="text-slate-200" />
        </div>
        <p className="text-sm font-medium">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      
      {/* --- Admin Chat Header --- */}
      <div className="flex-none px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <User size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 tracking-tight">
                {chatId.replace("support_", "User: ")}
              </h3>
              <span className="flex items-center gap-1 bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100 uppercase">
                <Circle size={8} fill="currentColor" /> Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck size={12} className="text-indigo-400" /> Secure Admin Session
            </p>
          </div>
        </div>

        {/* Header Actions (Optional) */}
        <div className="flex items-center gap-3">
            <button className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 px-3 py-1.5 rounded-lg">
                View Profile
            </button>
        </div>
      </div>

      {/* --- Messages Area: Fixed Height with Scroll --- */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30 custom-scrollbar">
        <ChatMessages chatId={chatId} currentRole={role} />
      </div>

      {/* --- Admin Reply Section --- */}
      <div className="flex-none shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <AdminReplyInput chatId={chatId} />
      </div>

    </div>
  );
}