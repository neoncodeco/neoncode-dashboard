"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import useFirebaseAuth from "@/hooks/useFirebaseAuth"; // Custom hook for auth
import { Send, Paperclip, X, Lock } from "lucide-react"; // Using Lucide icons for a modern touch

/**
 * Renders the chat interface for a single support ticket.
 * Allows the user to view messages, send new messages, and attach screenshots.
 */
export default function UserChatView() {
  // --- Hooks and State ---
  const { token, user } = useFirebaseAuth();
  const { ticketId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [attachedScreenshot, setAttachedScreenshot] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Helpers ---

  /** Scrolls the message container to the bottom. */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /** Checks if the message sender is the current logged-in user. */
  const isMessageMine = useCallback((senderId) => senderId === user?.uid, [user]);

  // --- API Handlers ---

  /** Fetches the latest ticket data from the API. */
  const loadTicketData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/support/ticket/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Handle non-200 responses if needed, e.g., redirect or show error
        console.error("Failed to load ticket data", res.status);
        setTicket(null); // Clear ticket on error
        return;
      }

      const json = await res.json();
      setTicket(json.data);
    } catch (error) {
      console.error("Error fetching ticket:", error);
    }
  }, [token, ticketId]);

  /** Uploads a screenshot file and returns the uploaded data. */
  const uploadScreenshot = async (file) => {
    setIsUploading(true);

    try {
      const fd = new FormData();
      fd.append("image", file); // Assuming the API expects "image" as the field name

      const res = await fetch("/api/upload/screenshot", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error uploading screenshot:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /** Handles file input change, uploads the file, and sets the state. */
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset the input value to allow the same file to be selected again
    e.target.value = null;

    const uploaded = await uploadScreenshot(file);
    if (uploaded && uploaded.url) {
      setAttachedScreenshot(uploaded);
    }
  };

  /** Sends the message (text and/or attached screenshot) to the API. */
  const sendMessage = async () => {
    const textToSend = messageText.trim();
    if (!textToSend && !attachedScreenshot) return;

    setIsSending(true);

    try {
      await fetch("/api/support/ticket/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticketId,
          text: textToSend,
          screenshots: attachedScreenshot ? [attachedScreenshot] : [],
        }),
      });

      // Clear input and attachment after successful send
      setMessageText("");
      setAttachedScreenshot(null);
      // Reload messages to show the new one
      await loadTicketData();
    } catch (error) {
      console.error("Error sending message:", error);
      // Optional: Show an error notification to the user
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Effects ---

  // 1. Initial load of ticket data
  useEffect(() => {
    if (token) {
      loadTicketData();
    }
  }, [token, loadTicketData]);

  // 2. Scroll to bottom whenever messages update
  useEffect(() => {
    // Only scroll if there are messages
    if (ticket?.messages.length) {
      scrollToBottom();
    }
  }, [ticket?.messages]);

  // --- Render (Loading State) ---

  if (!ticket) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-gray-500">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading support chat...
      </div>
    );
  }

  // --- Render (Main View) ---

  const isClosed = ticket.status === "closed";
  const canSend = (messageText.trim() || attachedScreenshot) && !isSending && !isUploading;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      
      {/* ================= Header (Ticket Info) ================= */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto p-4">
          <h1 className="text-xl font-bold text-gray-800 truncate">
            🎫 Ticket: {ticket.subject}
          </h1>
          <p
            className={`text-sm font-medium mt-1 ${
              isClosed ? "text-red-500" : "text-emerald-600"
            }`}
          >
            Status: **{ticket.status.toUpperCase()}**
          </p>
        </div>
      </div>

      {/* ================= Messages Area ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {ticket.messages.map((m, i) => {
            const mine = isMessageMine(m.senderId);
            const roleColor = 
              m.senderRole === "admin"
                ? "bg-red-100 text-red-700 border-red-300"
                : m.senderRole === "support"
                ? "bg-purple-100 text-purple-700 border-purple-300"
                : "bg-blue-100 text-blue-700 border-blue-300";

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
                  
                  {/* --- Avatar --- */}
                  <div className="flex-shrink-0 pt-1">
                    <img
                      src={m.senderPhoto || "/avatar.png"}
                      alt={`${m.senderName}'s avatar`}
                      className="w-9 h-9 rounded-full object-cover shadow border border-gray-200"
                    />
                  </div>

                  {/* --- Message Content (Name/Role ABOVE bubble) --- */}
                  <div className="flex flex-col">
                    {/* Name and Role Header */}
                    <div className={`flex items-center text-[10px]  ${mine ? "justify-end" : "justify-start"}`}>
                        <span className="font-semibold text-green-700">
                            {m.senderName || "Unknown"}
                        </span>
                        <span className={`text-[11px]  text-purple-700 font-semibold  `}>
                           ( {m.senderRole})
                        </span>
                    </div>

                    {/* Text bubble */}
                    {m.text?.trim() && (
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-md text-sm whitespace-pre-wrap ${
                          mine
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
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
                            title="View Screenshot"
                            className="block"
                          >
                            <img
                              src={img.url}
                              alt={`Screenshot ${idx + 1}`}
                              className="w-72 h-full rounded-lg object-cover border border-gray-300 shadow-sm hover:opacity-90 transition"
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

      {/* ================= Input/Footer ================= */}
      {isClosed ? (
        // Closed Ticket Footer
        <div className="bg-red-50 border-t border-red-200 text-red-700 text-center py-4 font-semibold flex items-center justify-center gap-2">
          <Lock size={18} />
          <span>This ticket is closed and cannot receive new messages.</span>
        </div>
      ) : (
        // Active Ticket Input Area
        <div className="bg-white border-t shadow-inner">
          <div className="max-w-5xl mx-auto p-4 space-y-2">
            
            {/* Screenshot Preview */}
            {attachedScreenshot && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <img
                  src={attachedScreenshot.url}
                  alt="Attached screenshot preview"
                  className="w-16 h-12 rounded-md object-cover border border-blue-300"
                />
                <span className="text-sm text-blue-800 flex-1 font-medium">
                  Screenshot attached: {attachedScreenshot.name || "Image.png"}
                </span>
                <button
                  onClick={() => setAttachedScreenshot(null)}
                  className="text-red-600 text-xs font-semibold hover:text-red-700 transition"
                  title="Remove attachment"
                >
                  <X size={16} className="inline-block mr-1" />
                  Remove
                </button>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-end gap-2">
              {/* Attach Button */}
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={isSending || isUploading}
                className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 border border-gray-300 transition disabled:opacity-50"
                title="Attach screenshot (Max 5MB)"
              >
                <Paperclip size={20} />
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Textarea Input */}
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here..."
                rows={1}
                className="flex-1 min-h-[44px] max-h-40 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none transition"
              />

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!canSend}
                className="w-11 h-11 flex-shrink-0 bg-blue-600 text-white rounded-full font-semibold shadow-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title="Send Message"
              >
                {isUploading ? (
                  // Simple loading spinner for uploading
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}