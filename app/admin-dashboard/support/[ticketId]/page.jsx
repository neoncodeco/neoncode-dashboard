"use client";

import { useEffect, useState, useRef } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useParams } from "next/navigation";

export default function AdminChatView() {
  const { token, user } = useFirebaseAuth();
  const { ticketId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ---------------- Helpers ---------------- */
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const load = async () => {
    const res = await fetch(`/api/admin/support/ticket/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setTicket(json.data);
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  /* ---------------- Screenshot Upload ---------------- */
  const uploadScreenshot = async (file) => {
    setUploading(true);

    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch("/api/upload/screenshot", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    setUploading(false);
    return data;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploaded = await uploadScreenshot(file);
    setScreenshot(uploaded);
  };

  /* ---------------- Send Reply ---------------- */
  const sendReply = async () => {
    if (!reply.trim() && !screenshot) return;

    await fetch("/api/admin/support/ticket/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ticketId,
        text: reply.trim(),
        screenshots: screenshot ? [screenshot] : [],
      }),
    });

    setReply("");
    setScreenshot(null);
    load();
  };

  if (!ticket) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-gray-500">
        Loading admin chat…
      </div>
    );
  }

  const isAdminMessage = (senderRole) =>
    senderRole === "admin" || senderRole === "manager";

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* ================= Header ================= */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto p-4">
          <h1 className="text-lg font-semibold text-gray-800 truncate">
            🎫 {ticket.subject}
          </h1>
          <p
            className={`text-sm font-medium mt-1 ${
              ticket.status === "closed" ? "text-red-500" : "text-emerald-600"
            }`}
          >
            Status: {ticket.status.toUpperCase()}
          </p>
        </div>
      </div>

      {/* ================= Messages ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {ticket.messages.map((m, i) => {
            const mine = isAdminMessage(m.senderRole);

            return (
              <div
                key={i}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-[75%] ${
                    mine ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  {!mine && (
                    <img
                      src={m.senderPhoto || "/avatar.png"}
                      className="w-9 h-9 rounded-full object-cover shadow border"
                    />
                  )}

                  <div className="flex flex-col">
                    {/* 🔥 NAME + ROLE (NEW) */}
                    <div
                      className={`text-[11px] font-medium mb-1 ${
                        mine ? "text-right" : "text-left"
                      }`}
                    >
                      <span className="text-emerald-700 font-semibold">
                        {m.senderName || "Unknown"}
                      </span>
                      <span className="text-purple-700 ml-1">
                        ({m.senderRole})
                      </span>
                    </div>

                    {/* Text Bubble */}
                    {m.text?.trim() && (
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${
                          mine
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-white border text-gray-800 rounded-tl-none"
                        }`}
                      >
                        {m.text}
                      </div>
                    )}

                    {/* Screenshots */}
                    {m.screenshots?.length > 0 && (
                      <div
                        className={`flex gap-2 mt-2 ${
                          mine ? "justify-end" : ""
                        }`}
                      >
                        {m.screenshots.map((img, idx) => (
                          <a
                            key={idx}
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={img.url}
                              className="w-72 h-full rounded-lg object-cover border shadow hover:scale-105 transition"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ================= Reply Input ================= */}
      {ticket.status !== "closed" ? (
        <div className="bg-white border-t shadow-lg">
          <div className="max-w-5xl mx-auto p-4 space-y-2">
            {/* Screenshot Preview */}
            {screenshot && (
              <div className="flex items-center gap-3 bg-slate-50 border rounded-xl p-2">
                <img
                  src={screenshot.url}
                  className="w-16 h-12 rounded-md object-cover border"
                />
                <span className="text-xs text-gray-600 flex-1">
                  Screenshot attached
                </span>
                <button
                  onClick={() => setScreenshot(null)}
                  className="text-red-500 text-xs font-semibold"
                >
                  ✕ Remove
                </button>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 border"
                title="Attach screenshot"
              >
                📎
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply…"
                className="flex-1 px-4 py-3 border rounded-full focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              <button
                onClick={sendReply}
                disabled={(!reply.trim() && !screenshot) || uploading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-100 text-red-700 text-center py-3 font-medium">
          🔒 Ticket is closed
        </div>
      )}
    </div>
  );
}
