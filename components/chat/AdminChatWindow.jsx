"use client";

import { useEffect, useState } from "react";
import ChatMessages from "./ChatMessages";
import AdminReplyInput from "./AdminReplyInput";
import useAppAuth from "@/hooks/useAppAuth";
import { User, Circle, ShieldCheck, Loader2 } from "lucide-react";

export default function AdminChatWindow({ chatId, userId }) {
  const { token, role } = useAppAuth();
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
      <div className="flex h-full flex-col items-center justify-center border-gray-100 bg-white text-slate-500 lg:border-l dark:bg-[#0f1d38] dark:text-[#9fb3de]">
        <div className="mb-4 rounded-full bg-sky-50 p-4 shadow-sm dark:bg-[#132546]">
          <User size={40} className="text-sky-600 dark:text-[#8ab4ff]" />
        </div>
        <p className="text-sm font-medium">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden border-gray-100 bg-white lg:border-l dark:bg-[#0f1d38]">
      
      {/* --- Admin Chat Header (Desktop View) --- */}
      <div className="hidden flex-none items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-[#22375d] dark:bg-[#0f1d38] lg:flex">
        <div className="flex items-center gap-4">
          {/* User Image or Icon */}
          <div className="relative">
            {userInfo.image ? (
              <img src={userInfo.image} alt="user" className="h-10 w-10 rounded-xl border border-slate-200 object-cover dark:border-[#22375d]" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-sky-50 text-sky-600 dark:border-[#2c4167] dark:bg-[#132546] dark:text-[#8ab4ff]">
                <User size={20} />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 dark:border-[#0f1d38]"></div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black tracking-tight text-slate-900 dark:text-[#f5f8ff]">
                {loading ? "Loading..." : userInfo.name}
              </h3>
              <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                <Circle size={6} fill="currentColor" /> Active
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium italic text-slate-500 dark:text-[#9fb3de]">
              <ShieldCheck size={12} className="text-sky-600 dark:text-[#8ab4ff]" /> Secure Admin Session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 transition-all hover:bg-slate-100 hover:text-sky-600 dark:border-[#2c4167] dark:bg-[#132546] dark:text-[#dce8ff] dark:hover:bg-[#18315c] dark:hover:text-[#8ab4ff]">
                User Details
            </button>
        </div>
      </div>

      {/* --- Messages Area --- */}
      <div className="relative flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0c1830]">
        <ChatMessages chatId={chatId} currentRole={role} variant="light" />
      </div>

      {/* --- Admin Reply Section --- */}
      <div className="flex-none border-t border-slate-200 bg-white p-3 shadow-[0_-10px_40px_-15px_rgba(15,23,42,0.08)] md:p-4 dark:border-[#22375d] dark:bg-[#0f1d38] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.24)]">
        <AdminReplyInput chatId={chatId} />
      </div>

    </div>
  );
}
