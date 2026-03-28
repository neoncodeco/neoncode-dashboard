"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { 
  Send, X, Lock, ShieldCheck, Image as ImageIcon, 
  Loader2, Search, MessageSquare, Clock, ChevronLeft 
} from "lucide-react";

export default function AdminSupportLayout() {
  const { token } = useFirebaseAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  
  const [reply, setReply] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const loadAllTickets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/support/ticket/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingList(false); }
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
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadAllTickets(); }, [loadAllTickets]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedTicket?.messages]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/upload/screenshot", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Image upload failed");
      }
      setScreenshot({
        url: data.url,
        ...(data.deleteUrl ? { deleteUrl: data.deleteUrl } : {}),
      });
    } catch (err) {
      console.error("Upload error:", err);
    } finally { setIsUploading(false); }
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
    } finally { setIsSending(false); }
  };

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-transparent pt-16 text-white lg:h-screen lg:flex-row lg:pt-0">
      
      <div className={`${selectedTicket ? "hidden lg:flex" : "flex"} h-full w-full shrink-0 flex-col border-b lg:border-b-0 lg:border-r border-[#2c4167] bg-[#0f1d38] lg:w-[350px]`}>
        <div className="p-5 border-b border-[#2c4167] bg-[#0f1d38]">
          <h1 className="mb-4 text-xl font-black tracking-tight text-[#dce8ff] sm:text-2xl">Support Panel</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-3 bg-[#132546] border border-[#2c4167] rounded-2xl text-sm text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingList ? (
            <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>
          ) : (
            tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => selectTicket(t._id)}
                className={`flex cursor-pointer items-center gap-4 bg-[#14284d] p-5 transition-all ${selectedTicket?._id === t._id ? "bg-[#1b2f57] border-r-4 border-r-[#8ab4ff] shadow-sm" : "hover:bg-[#1a315d]"}`}
              >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${t.status === 'open' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-[#243a63] text-[#9fb3de]'}`}>
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`truncate text-sm font-extrabold ${selectedTicket?._id === t._id ? "text-[#8ab4ff]" : "text-gray-100"}`}>{t.subject}</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[12px] text-gray-400 font-medium truncate uppercase tracking-tighter">User: {t.userId?.slice(-6)}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${t.status === 'open' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-red-400/20 bg-red-400/10 text-red-200'}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE: CHAT VIEW --- */}
      {/* মোবাইলে এবং ট্যাবলেটে (lg এর নিচে) টিকেট সিলেক্ট না থাকলে এটি লুকানো থাকবে */}
      <div className={`${!selectedTicket ? "hidden lg:flex" : "flex"} relative min-h-[calc(100svh-4rem)] lg:min-h-0 h-full w-full min-w-0 flex-1 flex-col bg-[#0c1830]`}>
        {selectedTicket ? (
          <>
            {/* Header: Back Button visible on Mobile & Tablet (lg:hidden) */}
            <div className="px-5 py-4 bg-[#0f1d38] border-b border-[#2c4167] flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedTicket(null)} 
                  className="lg:hidden p-2.5 -ml-2 hover:bg-[#1b2f57] rounded-2xl transition-all text-gray-200 border border-transparent active:scale-90"
                >
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <div>
                  <h2 className="font-black text-gray-100 text-base lg:text-lg tracking-tight leading-tight">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span className="text-[#8ab4ff]">Official Support</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                    <span>UID: {selectedTicket.userId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 xl:p-8">
              <div className=" mx-auto">
                {selectedTicket.messages?.map((m, i) => {
                  const isAdmin = m.senderRole === "admin" || m.senderRole === "manager";
                  return (
                    <div key={i} className={`flex w-full mb-8 ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`flex max-w-[94%] flex-col sm:max-w-[88%] md:max-w-[75%] ${isAdmin ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1.5 px-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {isAdmin ? "Admin Response" : m.senderName || "End User"}
                          </span>
                          {isAdmin && <ShieldCheck size={14} className="fill-[#8ab4ff]/20 text-[#8ab4ff]" />}
                        </div>
                        <div className={`p-4 md:p-5 rounded-[24px] text-sm md:text-[15px] shadow-sm leading-relaxed border transition-all ${
                          isAdmin ? "rounded-tr-none border-[#8ab4ff] bg-[#6f95df] text-[#081227] shadow-[#2c53a0]/20" : "rounded-tl-none border-[#2c4167] bg-[#0f1d38] text-gray-100"
                        }`}>
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          {m.screenshots?.map((img, idx) => (
                            <div key={idx} className="mt-4 overflow-hidden rounded-2xl shadow-md ring-2 ring-black/5">
                              <img src={img.url} className="max-h-80 w-full object-cover sm:w-auto" alt="Attachment" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Admin Input Area */}
            <div className="border-t border-[#2c4167] bg-[#0f1d38] p-3 shadow-[0_-8px_30px_rgb(0,0,0,0.2)] sm:p-4 md:p-6">
              <div className="max-w-4xl mx-auto">
                {selectedTicket.status !== "closed" ? (
                  <div className="space-y-4">
                    {screenshot && (
                      <div className="relative inline-block animate-in zoom-in slide-in-from-bottom-3">
                        <img src={screenshot.url} className="h-24 w-24 rounded-2xl border-2 border-[#8ab4ff] object-cover shadow-xl ring-4 ring-[#8ab4ff]/10" alt="Reply attachment preview" />
                        <button onClick={() => setScreenshot(null)} className="absolute -top-3 -right-3 rounded-full border-2 border-[#132546] bg-red-500 p-2 text-white shadow-lg hover:bg-red-600"><X size={12}/></button>
                      </div>
                    )}
                    <div className="flex items-end gap-2 rounded-[24px] border-2 border-[#2c4167] bg-[#132546] p-2.5 shadow-inner transition-all focus-within:border-[#8ab4ff] focus-within:bg-[#152a51] sm:gap-3 sm:p-3 sm:rounded-[28px]">
                      <label className="cursor-pointer p-3 text-gray-400 transition-all hover:text-[#8ab4ff] active:scale-90">
                        {isUploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                        <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
                      </label>
                      <textarea 
                        value={reply} 
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your official message..."
                        className="min-h-[48px] max-h-40 flex-1 resize-none border-none bg-transparent py-3 text-sm outline-none focus:ring-0 md:text-base"
                        rows={1}
                        onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                      />
                      <button 
                        onClick={sendReply} 
                        disabled={isSending || isUploading || (!reply.trim() && !screenshot)}
                        className={`flex min-h-[56px] min-w-[56px] items-center justify-center rounded-2xl p-4 shadow-xl transition-all ${
                          isSending || isUploading || (!reply.trim() && !screenshot)
                          ? "bg-slate-700 text-slate-400"
                          : "bg-[#8ab4ff] text-[#081227] hover:bg-[#9fc0ff] hover:shadow-[#2c53a0]/30 active:scale-95"
                        }`}
                      >
                        {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="rotate-45" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-red-400/20 bg-red-400/10 py-6 text-center text-xs font-black uppercase tracking-[3px] text-red-200">
                    <Lock size={18} /> Ticket Closed for Responses
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 p-10 text-center">
            <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-[40px] border border-[#2c4167] bg-[#0f1d38] shadow-xl animate-bounce transition-all duration-1000">
              <MessageSquare size={48} className="fill-[#8ab4ff]/20 text-[#dce8ff]" />
            </div>
            <h3 className="text-2xl font-black text-gray-100 tracking-tight">Select conversation</h3>
            <p className="text-xs max-w-[240px] mt-3 font-bold uppercase tracking-widest text-gray-400 leading-loose">Choose a user ticket from the list to start responding.</p>
          </div>
        )}
      </div>
    </div>
  );
}
