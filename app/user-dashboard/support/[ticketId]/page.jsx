"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { Send, X, Lock, ChevronLeft, ShieldCheck, Image as ImageIcon, Loader2 } from "lucide-react";

export default function UserChatView({ ticketIdFromProps, onBack }) {
  const { token, user } = useFirebaseAuth();
  const params = useParams();
  const messagesEndRef = useRef(null);

  const rawId = ticketIdFromProps || params.ticketId;
  const ticketId = typeof rawId === 'object' ? (rawId.ticketId || rawId.$oid || rawId.toString()) : rawId;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [attachedScreenshot, setAttachedScreenshot] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const loadTicketData = useCallback(async () => {
    if (!token || !ticketId || ticketId === "null") {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/support/ticket/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setTicket(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, ticketId]);

  useEffect(() => { loadTicketData(); }, [loadTicketData]);

  useEffect(() => {
    if (ticket?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticket?.messages]);

  // ইমেজ আপলোড হ্যান্ডলার
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/upload/screenshot", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Image upload failed");
      }
      setAttachedScreenshot({
        url: data.url,
        ...(data.deleteUrl ? { deleteUrl: data.deleteUrl } : {}),
      }); // সরাসরি API থেকে আসা ডাটা সেট হবে
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async () => {
    if ((!messageText.trim() && !attachedScreenshot) || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/support/ticket/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ticketId,
          text: messageText,
          screenshots: attachedScreenshot ? [attachedScreenshot] : [],
        }),
      });
      if (res.ok) {
        setMessageText("");
        setAttachedScreenshot(null);
        loadTicketData();
      }
    } catch (err) { console.error(err); }
    finally { setIsSending(false); }
  };

  if (loading) return (
    <div className="dashboard-subpanel h-full flex flex-col items-center justify-center space-y-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--dashboard-accent)] border-t-transparent" />
      <p className="dashboard-text-muted text-sm animate-pulse font-medium">Loading conversation...</p>
    </div>
  );

  if (!ticket) return (
    <div className="dashboard-subpanel h-full flex flex-col items-center justify-center p-5">
      <p className="dashboard-text-muted text-sm font-medium">Conversation not found.</p>
      <button onClick={onBack} className="mt-4 font-bold underline" style={{ color: "var(--dashboard-accent)" }}>Go Back</button>
    </div>
  );

  return (
    <div className="user-dashboard-theme-scope flex flex-col h-full" style={{ background: "var(--dashboard-page-bg)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-start justify-between gap-3 px-4 py-4 backdrop-blur-md sm:items-center sm:py-[22px]"
        style={{ background: "var(--dashboard-frame-bg)", borderBottom: "1px solid var(--dashboard-frame-border)" }}
      >
        <div className="flex items-start sm:items-center gap-3 overflow-hidden min-w-0">
          <button onClick={onBack} className="dashboard-subpanel lg:hidden p-1.5 rounded-full transition">
            <ChevronLeft size={24} className="dashboard-text-muted" />
          </button>
          <div className="overflow-hidden min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {ticket.departmentName ? (
                <span className="dashboard-chip px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em]">
                  {ticket.departmentName}
                </span>
              ) : null}
              {ticket.priority ? (
                <span className="rounded-full border border-emerald-300/50 bg-emerald-100/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  {ticket.priority} priority
                </span>
              ) : null}
            </div>
            <h2 className="dashboard-text-strong font-bold text-sm md:text-xl truncate leading-tight">{ticket.subject}</h2>
            <p className="dashboard-text-muted text-[10px] md:text-xs font-medium tracking-tight uppercase">Ticket ID: {ticketId.toString().slice(-6)}</p>
          </div>
        </div>
        <div className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
          ticket.status === 'open' ? 'border-emerald-300/50 bg-emerald-100/80 text-emerald-700' : 'border-rose-300/50 bg-rose-100/80 text-rose-700'
        }`}>
          {ticket.status}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 space-y-6 overflow-y-auto bg-[var(--dashboard-panel-soft)]/65 p-4 md:p-6">
        {ticket.messages.map((m, i) => {
          const isMine = m.senderId === user?.uid;
          return (
            <div key={i} className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`flex flex-col max-w-[92%] sm:max-w-[85%] md:max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  {!isMine && <div className="dashboard-subpanel p-1 rounded-full"><ShieldCheck size={10} className="dashboard-text-muted" /></div>}
                  <span className="dashboard-text-strong text-[11px] font-bold uppercase tracking-tighter">
                    {isMine ? "You" : m.senderName}
                  </span>
                  {!isMine && <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">{m.senderRole}</span>}
                </div>
                <div className={`relative rounded-2xl p-3 text-sm leading-relaxed shadow-sm transition-all duration-200 md:p-4 ${
                  isMine
                    ? "rounded-tr-none bg-emerald-600 text-white shadow-[0_10px_24px_rgba(16,185,129,0.28)]"
                    : "dashboard-subpanel dashboard-text-strong rounded-tl-none border border-[var(--dashboard-frame-border)] bg-white"
                }`}>
                  <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                  {m.screenshots?.map((img, idx) => (
                    <div key={idx} className="mt-3 overflow-hidden rounded-xl border border-black/10 bg-white/70">
                      <img src={img.url} className="max-h-60 md:max-h-80 w-full object-cover" alt="attachment" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-3 md:p-5" style={{ background: "var(--dashboard-frame-bg)", borderTop: "1px solid var(--dashboard-frame-border)" }}>
        {ticket.status !== "closed" ? (
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Screenshot Preview */}
            {attachedScreenshot && (
              <div className="relative inline-block animate-in fade-in slide-in-from-bottom-2">
                <div className="h-20 w-20 overflow-hidden rounded-xl border-2 border-emerald-400 shadow-md">
                  <img src={attachedScreenshot.url} className="w-full h-full object-cover" alt="preview" />
                </div>
                <button onClick={() => setAttachedScreenshot(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition">
                  <X size={14}/>
                </button>
              </div>
            )}

            <div className="dashboard-subpanel flex min-w-0 items-end gap-2 rounded-2xl border border-[var(--dashboard-frame-border)] bg-white p-2 transition-all">
              {/* Image Upload Button */}
              <label className="cursor-pointer p-2.5 dashboard-text-muted transition-colors hover:text-emerald-600">
                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
              </label>

              <textarea 
                value={messageText} 
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[44px] max-h-32 flex-1 min-w-0 resize-none border-none bg-transparent p-2 text-sm font-medium text-[var(--dashboard-text-strong)] outline-none placeholder:text-[var(--dashboard-text-muted)] focus:ring-0 md:text-base"
                rows={1}
                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              />
              
              <button 
                onClick={sendMessage} 
                disabled={isSending || isUploading || (!messageText.trim() && !attachedScreenshot)} 
                className={`rounded-xl p-3 transition-all ${
                  isSending || isUploading || (!messageText.trim() && !attachedScreenshot)
                  ? "dashboard-muted-button"
                    : "bg-emerald-600 text-white shadow-lg hover:scale-105 hover:bg-emerald-700 active:scale-95"
                }`}
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard-subpanel p-4 border border-dashed rounded-2xl dashboard-text-muted text-xs text-center font-semibold flex items-center justify-center gap-3">
             <Lock size={16}/> This conversation is closed
          </div>
        )}
      </div>
    </div>
  );
}
