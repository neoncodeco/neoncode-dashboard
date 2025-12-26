"use client";

import { useEffect, useState } from "react";
import ChatMessages from "./ChatMessages";
import AdminReplyInput from "./AdminReplyInput";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { User, Circle, ShieldCheck, Loader2 } from "lucide-react";

export default function AdminChatWindow({ chatId, userId }) {
  const { token, role } = useFirebaseAuth();
  const [userInfo, setUserInfo] = useState({ name: "", image: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chatId || !token || !userId) return;

    const markAsReadAndFetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/chat/read", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ chatId, userId }),
        });
        const data = await res.json();
        if (data.ok) {
          setUserInfo(data.user);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      } finally {
        setLoading(false);
      }
    };

    markAsReadAndFetchUser();
  }, [chatId, token, userId]);

  if (!chatId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 lg:border-l border-gray-100">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
          <User size={40} className="text-slate-200" />
        </div>
        <p className="text-sm font-medium">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white lg:border-l border-gray-100 overflow-hidden">
      
      {/* --- Admin Chat Header (Desktop View) --- */}
      <div className="hidden lg:flex flex-none px-6 py-4 bg-white border-b border-gray-100 items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {/* User Image or Icon */}
          <div className="relative">
            {userInfo.image ? (
              <img src={userInfo.image} alt="user" className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <User size={20} />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-800 tracking-tight">
                {loading ? "Loading..." : userInfo.name}
              </h3>
              <span className="flex items-center gap-1 bg-green-50 text-green-600 text-[9px] font-black px-2 py-0.5 rounded-full border border-green-100 uppercase tracking-wider">
                <Circle size={6} fill="currentColor" /> Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-medium italic">
              <ShieldCheck size={12} className="text-indigo-400" /> Secure Admin Session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-all bg-slate-50 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-gray-100 uppercase tracking-wider">
                User Details
            </button>
        </div>
      </div>

      {/* --- Messages Area --- */}
      <div className="flex-1 overflow-y-auto bg-slate-50/20 relative">
        <ChatMessages chatId={chatId} currentRole={role} />
      </div>

      {/* --- Admin Reply Section --- */}
      <div className="flex-none p-3 md:p-4 bg-white border-t border-gray-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        <AdminReplyInput chatId={chatId} />
      </div>

    </div>
  );
}