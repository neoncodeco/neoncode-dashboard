"use client";

import { useEffect, useState } from "react";
import ChatMessages from "./ChatMessages";
import AdminReplyInput from "./AdminReplyInput";
import useAppAuth from "@/hooks/useAppAuth";
import { Loader2 } from "lucide-react";

function getInitials(name) {
  const base = (name || "G").trim();
  return base
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chatId, userId }),
        });
        const data = await res.json();
        if (data.ok) setUserInfo(data.user);
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
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Select a conversation to start messaging
      </div>
    );
  }

  const displayName = loading ? "Loading..." : userInfo.name || "Guest User";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="hidden shrink-0 items-center gap-3 border-b border-gray-200 px-5 py-3 lg:flex">
        {userInfo.image ? (
          <img src={userInfo.image} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-600">
            {getInitials(displayName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-gray-900">{displayName}</h3>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Active
            </span>
          </div>
          <p className="truncate text-xs text-gray-400">Live chat session</p>
        </div>
        {loading ? <Loader2 size={16} className="animate-spin text-gray-400" /> : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#f8fafc]">
        <ChatMessages chatId={chatId} currentRole={role} variant="admin" />
      </div>

      <AdminReplyInput chatId={chatId} />
    </div>
  );
}
