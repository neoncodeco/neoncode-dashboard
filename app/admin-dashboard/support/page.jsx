"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import useAppAuth from "@/hooks/useAppAuth";
import Swal from "sweetalert2";
import {
  Send,
  X,
  Lock,
  Image as ImageIcon,
  Loader2,
  Search,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";

function statusStyle(status) {
  const value = (status || "").toLowerCase();
  if (value === "open") return "bg-emerald-50 text-emerald-700";
  return "bg-gray-100 text-gray-600";
}

export default function AdminSupportLayout() {
  const { token } = useAppAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [reply, setReply] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMutatingTicket, setIsMutatingTicket] = useState(false);

  const messagesEndRef = useRef(null);

  const loadAllTickets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/support/ticket/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  const selectTicket = async (id) => {
    setReply("");
    setScreenshot(null);
    try {
      const res = await fetch(`/api/admin/support/ticket/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setSelectedTicket(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAllTickets();
  }, [loadAllTickets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/upload/screenshot", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Image upload failed");
      setScreenshot({
        url: data.url,
        ...(data.deleteUrl ? { deleteUrl: data.deleteUrl } : {}),
      });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const sendReply = async () => {
    if ((!reply.trim() && !screenshot) || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/admin/support/ticket/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ticketId: selectedTicket._id,
          text: reply.trim(),
          screenshots: screenshot ? [screenshot] : [],
        }),
      });
      if (res.ok) {
        setReply("");
        setScreenshot(null);
        await selectTicket(selectedTicket._id);
        loadAllTickets();
      }
    } finally {
      setIsSending(false);
    }
  };

  const closeSelectedTicket = async () => {
    if (!selectedTicket?._id || isMutatingTicket) return;
    const confirmResult = await Swal.fire({
      title: "Close ticket?",
      text: "The user will no longer be able to send messages on this ticket.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, close ticket",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#64748b",
    });
    if (!confirmResult.isConfirmed) return;

    setIsMutatingTicket(true);
    try {
      const res = await fetch(`/api/admin/support/ticket/${selectedTicket._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to close ticket");
      await selectTicket(selectedTicket._id);
      await loadAllTickets();
    } catch (err) {
      await Swal.fire({
        title: "Close failed",
        text: err?.message || "Could not close this ticket.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsMutatingTicket(false);
    }
  };

  const deleteSelectedTicket = async () => {
    if (!selectedTicket?._id || isMutatingTicket) return;
    const confirmResult = await Swal.fire({
      title: "Delete ticket?",
      text: "This will permanently remove the ticket and all messages.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });
    if (!confirmResult.isConfirmed) return;

    setIsMutatingTicket(true);
    try {
      const res = await fetch(`/api/admin/support/ticket/${selectedTicket._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete ticket");
      setSelectedTicket(null);
      await loadAllTickets();
    } catch (err) {
      await Swal.fire({
        title: "Delete failed",
        text: err?.message || "Could not delete this ticket.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsMutatingTicket(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      (t.subject || "").toLowerCase().includes(q) ||
      (t.userName || "").toLowerCase().includes(q) ||
      (t.userId || "").toLowerCase().includes(q) ||
      (t.departmentName || "").toLowerCase().includes(q)
    );
  });

  const handleReplyKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  return (
    <div className="-mx-3 flex h-[calc(100svh-4.5rem)] overflow-hidden border-y border-gray-200 bg-white sm:-mx-4 md:-mx-5 lg:mx-0 lg:h-[calc(100vh-3.5rem)] lg:rounded-xl lg:border lg:border-gray-200">
      {/* Ticket list */}
      <div
        className={`${
          selectedTicket ? "hidden lg:flex" : "flex flex-1 lg:flex-none"
        } w-full min-w-0 flex-col border-r border-gray-200 lg:w-72 xl:w-80`}
      >
        <div className="flex-none border-b border-gray-200 bg-white px-4 py-4">
          <h2 className="mb-3 text-sm font-bold text-gray-900">Support</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/60">
          {loadingList ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-gray-400" size={22} />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center px-4 text-center text-gray-400">
              <MessageSquare size={28} className="mb-2 opacity-40" />
              <p className="text-sm">No tickets found</p>
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isActive = selectedTicket?._id === t._id;
              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => selectTicket(t._id)}
                  className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition ${
                    isActive
                      ? "border-l-[3px] border-l-sky-500 bg-sky-50/70 pl-[13px]"
                      : "border-l-[3px] border-l-transparent hover:bg-white"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      t.status === "open" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <MessageSquare size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className={`truncate text-sm font-semibold ${isActive ? "text-sky-700" : "text-gray-900"}`}>
                        {t.subject}
                      </p>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${statusStyle(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {t.userName || "Unknown"} {t.userId ? `· ${t.userId.slice(-6)}` : ""}
                    </p>
                    {(t.departmentName || t.priority) && (
                      <p className="mt-1 truncate text-[10px] text-gray-400">
                        {[t.departmentName, t.priority].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Ticket detail */}
      <div
        className={`${
          !selectedTicket ? "hidden lg:flex" : "flex"
        } relative min-w-0 flex-1 flex-col bg-white`}
      >
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 lg:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 lg:hidden"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-gray-900">{selectedTicket.subject}</h2>
                  <p className="truncate text-xs text-gray-400">
                    {selectedTicket.userName || "Unknown"} · {selectedTicket.userId}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {selectedTicket.status !== "closed" ? (
                  <button
                    type="button"
                    onClick={closeSelectedTicket}
                    disabled={isMutatingTicket}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                  >
                    Close
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={deleteSelectedTicket}
                  disabled={isMutatingTicket}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-4 py-4 lg:px-5">
              {selectedTicket.messages?.length ? (
                selectedTicket.messages.map((m, i) => {
                  const isAdmin = m.senderRole === "admin" || m.senderRole === "manager";
                  return (
                    <div key={i} className={`mb-3 flex w-full ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] sm:max-w-[68%] ${isAdmin ? "items-end" : "items-start"}`}>
                        <p className={`mb-1 px-1 text-[10px] text-gray-400 ${isAdmin ? "text-right" : "text-left"}`}>
                          {isAdmin ? "You" : m.senderName || "User"}
                        </p>
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            isAdmin
                              ? "rounded-br-md bg-sky-600 text-white"
                              : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
                          }`}
                        >
                          {m.text ? <p className="whitespace-pre-wrap break-words">{m.text}</p> : null}
                          {m.screenshots?.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.url}
                              alt="Attachment"
                              className="mt-2 max-h-64 max-w-full rounded-lg object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">No messages on this ticket yet.</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply */}
            {selectedTicket.status !== "closed" ? (
              <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 lg:px-5">
                {screenshot ? (
                  <div className="relative mb-2 inline-block">
                    <img src={screenshot.url} alt="Preview" className="h-16 w-16 rounded-lg border border-gray-200 object-cover" />
                    <button
                      type="button"
                      onClick={() => setScreenshot(null)}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : null}
                <div className="flex items-end gap-2">
                  <label className="flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700">
                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                    <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
                  </label>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={handleReplyKeyDown}
                    placeholder="Write a reply..."
                    disabled={isSending || isUploading}
                    rows={1}
                    className="max-h-32 min-h-[42px] flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white disabled:opacity-60"
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                    }}
                  />
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={isSending || isUploading || (!reply.trim() && !screenshot)}
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-gray-400">Enter to send · Shift+Enter for new line</p>
              </div>
            ) : (
              <div className="flex shrink-0 items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                <Lock size={15} />
                This ticket is closed
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <MessageSquare size={40} className="mb-4 text-gray-300" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-gray-900">Select a ticket</h3>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Choose a support ticket from the list to view and reply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
