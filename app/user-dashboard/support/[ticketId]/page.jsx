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
    <div className="h-full flex flex-col items-center justify-center space-y-3 bg-white">
      <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm animate-pulse font-medium">Loading conversation...</p>
    </div>
  );

  if (!ticket) return (
    <div className="h-full flex flex-col items-center justify-center p-5 bg-white">
      <p className="text-gray-400 text-sm font-medium">Conversation not found.</p>
      <button onClick={onBack} className="mt-4 text-[#10B981] font-bold underline">Go Back</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white lg:bg-[#F8FAFC]">
      {/* Header */}
      <div className="px-4 py-[22px] bg-white flex items-center justify-between sticky top-0 z-10 shadow-sm ">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onBack} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-full transition">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <div className="overflow-hidden">
            <h2 className="font-bold text-gray-800 text-sm md:text-xl truncate leading-tight">{ticket.subject}</h2>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium tracking-tight uppercase">Ticket ID: {ticketId.toString().slice(-6)}</p>
          </div>
        </div>
        <div className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
          ticket.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {ticket.status}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {ticket.messages.map((m, i) => {
          const isMine = m.senderId === user?.uid;
          return (
            <div key={i} className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  {!isMine && <div className="bg-gray-200 p-1 rounded-full"><ShieldCheck size={10} className="text-gray-600" /></div>}
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">
                    {isMine ? "You" : m.senderName}
                  </span>
                  {!isMine && <span className="text-[9px] bg-[#10B981] text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest">{m.senderRole}</span>}
                </div>
                <div className={`relative p-3 md:p-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 ${
                  isMine ? "bg-[#10B981] text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.screenshots?.map((img, idx) => (
                    <div key={idx} className="mt-3 overflow-hidden rounded-xl border border-black/5">
                      <img src={img.url} className="max-h-60 md:max-h-80 w-auto object-cover" alt="attachment" />
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
      <div className="p-3 md:p-5 bg-white border-t border-gray-100">
        {ticket.status !== "closed" ? (
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Screenshot Preview */}
            {attachedScreenshot && (
              <div className="relative inline-block animate-in fade-in slide-in-from-bottom-2">
                <div className="w-20 h-20 border-2 border-[#10B981] rounded-xl overflow-hidden shadow-md">
                  <img src={attachedScreenshot.url} className="w-full h-full object-cover" alt="preview" />
                </div>
                <button onClick={() => setAttachedScreenshot(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition">
                  <X size={14}/>
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-[#10B981] transition-all">
              {/* Image Upload Button */}
              <label className="p-2.5 text-gray-400 hover:text-[#10B981] cursor-pointer transition-colors">
                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
              </label>

              <textarea 
                value={messageText} 
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-none p-2 text-sm md:text-base focus:ring-0 outline-none resize-none min-h-[44px] max-h-32"
                rows={1}
                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              />
              
              <button 
                onClick={sendMessage} 
                disabled={isSending || isUploading || (!messageText.trim() && !attachedScreenshot)} 
                className={`p-3 rounded-xl transition-all ${
                  isSending || isUploading || (!messageText.trim() && !attachedScreenshot)
                  ? "bg-gray-200 text-gray-400"
                  : "bg-[#10B981] text-white shadow-lg hover:scale-105 active:scale-95"
                }`}
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-500 text-xs text-center font-semibold flex items-center justify-center gap-3">
             <Lock size={16}/> This conversation is closed
          </div>
        )}
      </div>
    </div>
  );
}
