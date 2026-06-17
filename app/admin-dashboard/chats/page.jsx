"use client";

import { useState } from "react";
import AdminChatInbox from "@/components/chat/AdminChatInbox";
import AdminChatWindow from "@/components/chat/AdminChatWindow";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default function AdminChatsPage() {
  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="-mx-3 flex h-[calc(100svh-4.5rem)] overflow-hidden border-y border-gray-200 bg-white sm:-mx-4 md:-mx-5 lg:mx-0 lg:h-[calc(100vh-3.5rem)] lg:rounded-xl lg:border lg:border-gray-200">
      {/* Inbox */}
      <div
        className={`${
          activeChat ? "hidden lg:flex" : "flex flex-1 lg:flex-none"
        } w-full min-w-0 flex-col border-r border-gray-200 lg:w-72 xl:w-80`}
      >
        <AdminChatInbox onSelect={setActiveChat} selectedChatId={activeChat?.chatId} />
      </div>

      {/* Chat panel */}
      <div
        className={`${
          activeChat ? "flex flex-1" : "hidden lg:flex lg:flex-1"
        } relative min-w-0 flex-col bg-white`}
      >
        {activeChat ? (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-3 lg:hidden">
              <button
                type="button"
                onClick={() => setActiveChat(null)}
                className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {activeChat.userName || activeChat.guestName || "Guest User"}
                </p>
                <p className="text-xs text-emerald-600">Active</p>
              </div>
            </div>

            <AdminChatWindow chatId={activeChat.chatId} userId={activeChat.userId} />
          </>
        ) : (
          <div className="hidden h-full flex-col items-center justify-center px-6 text-center lg:flex">
            <MessageSquare size={40} className="mb-4 text-gray-300" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-gray-900">Select a conversation</h3>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Choose a chat from the inbox to start replying.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
