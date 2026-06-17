"use client";

import useAppAuth from "@/hooks/useAppAuth";
import { useCallback, useEffect, useState } from "react";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function getInitials(name) {
  const base = (name || "G").trim();
  return base
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminChatInbox({ onSelect, selectedChatId }) {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { token } = useAppAuth();

  const fetchChats = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  const formatTime = (updatedAt) => {
    if (!updatedAt) return "Now";
    try {
      const date = updatedAt.seconds
        ? new Date(updatedAt.seconds * 1000)
        : new Date(updatedAt);
      if (Number.isNaN(date.getTime())) return "Recently";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  const filteredChats = chats.filter((chat) =>
    (chat.userName || chat.guestName || chat.userId || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gray-50/60">
      <div className="flex-none border-b border-gray-200 bg-white px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-gray-900">Inbox</h2>
          {loading ? <Loader2 size={14} className="animate-spin text-gray-400" /> : null}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 && !loading ? (
          <div className="flex h-40 flex-col items-center justify-center px-4 text-center text-gray-400">
            <MessageSquare size={28} className="mb-2 opacity-40" />
            <p className="text-sm">No conversations found</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = selectedChatId === chat.chatId;
            const displayName = chat.userName || chat.guestName || "Guest User";

            return (
              <button
                key={chat.chatId}
                type="button"
                onClick={() => onSelect(chat)}
                className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition ${
                  isActive
                    ? "border-l-[3px] border-l-sky-500 bg-sky-50/70 pl-[13px]"
                    : "border-l-[3px] border-l-transparent hover:bg-white"
                }`}
              >
                {chat.userImage ? (
                  <img
                    src={chat.userImage}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                    alt=""
                  />
                ) : (
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isActive ? "bg-sky-500 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {getInitials(displayName)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate text-sm font-semibold ${
                        isActive ? "text-sky-700" : "text-gray-900"
                      }`}
                    >
                      {displayName}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-gray-500">
                      <span className="font-medium text-gray-400">
                        {chat.lastSender === "user" ? "" : "You: "}
                      </span>
                      {chat.lastMessage || "Attachment"}
                    </p>
                    {chat.unreadForAdmin > 0 ? (
                      <span className="shrink-0 rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {chat.unreadForAdmin}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
