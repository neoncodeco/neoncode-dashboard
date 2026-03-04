"use client";
import { useEffect, useState, useRef } from "react";
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

  const loadAllTickets = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/support/ticket/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingList(false); }
  };

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

  useEffect(() => { loadAllTickets(); }, [token]);
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
    <div className="flex h-screen bg-transparent overflow-hidden text-white pt-16 md:pt-0 lg:pt-0">
      
      <div className={`${selectedTicket ? "hidden lg:flex" : "flex"} w-full lg:w-[350px] bg-[#0f1d38] border-r border-[#2c4167] flex-col shrink-0 h-full`}>
        <div className="p-5 border-b border-[#2c4167] bg-[#0f1d38]">
          <h1 className="text-2xl font-black tracking-tight mb-4 text-indigo-600">Support Panel</h1>
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
                className={`p-5 cursor-pointer transition-all gap-3 bg-[#14284d] flex items-center gap-4 ${selectedTicket?._id === t._id ? "bg-[#1b2f57] border-r-4 border-r-indigo-500 shadow-sm" : "hover:bg-[#1a315d]"}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${t.status === 'open' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`text-sm font-extrabold truncate ${selectedTicket?._id === t._id ? "text-indigo-300" : "text-gray-100"}`}>{t.subject}</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[12px] text-gray-400 font-medium truncate uppercase tracking-tighter">User: {t.userId?.slice(-6)}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${t.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
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
      <div className={`${!selectedTicket ? "hidden lg:flex" : "flex"} flex-1 flex-col bg-[#0c1830] h-full relative`}>
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
                    <span className="text-indigo-600">Official Support</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                    <span>UID: {selectedTicket.userId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className=" mx-auto">
                {selectedTicket.messages?.map((m, i) => {
                  const isAdmin = m.senderRole === "admin" || m.senderRole === "manager";
                  return (
                    <div key={i} className={`flex w-full mb-8 ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`flex flex-col max-w-[88%] md:max-w-[75%] ${isAdmin ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1.5 px-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {isAdmin ? "Admin Response" : m.senderName || "End User"}
                          </span>
                          {isAdmin && <ShieldCheck size={14} className="text-indigo-500 fill-indigo-50" />}
                        </div>
                        <div className={`p-4 md:p-5 rounded-[24px] text-sm md:text-[15px] shadow-sm leading-relaxed border transition-all ${
                          isAdmin ? "bg-indigo-600 text-white rounded-tr-none border-indigo-500 shadow-indigo-100" : "bg-[#0f1d38] border-[#2c4167] text-gray-100 rounded-tl-none"
                        }`}>
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          {m.screenshots?.map((img, idx) => (
                            <div key={idx} className="mt-4 rounded-2xl overflow-hidden shadow-md ring-2 ring-black/5">
                              <img src={img.url} className="max-h-80 w-auto object-cover" alt="img" />
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
            <div className="p-4 md:p-6 bg-[#0f1d38] border-t border-[#2c4167] shadow-[0_-8px_30px_rgb(0,0,0,0.2)]">
              <div className="max-w-4xl mx-auto">
                {selectedTicket.status !== "closed" ? (
                  <div className="space-y-4">
                    {screenshot && (
                      <div className="relative inline-block animate-in zoom-in slide-in-from-bottom-3">
                        <img src={screenshot.url} className="w-24 h-24 object-cover rounded-2xl border-2 border-indigo-600 shadow-xl ring-4 ring-indigo-50" />
                        <button onClick={() => setScreenshot(null)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg border-2 border-white hover:bg-red-600"><X size={12}/></button>
                      </div>
                    )}
                    <div className="flex items-end gap-3 bg-[#132546] p-3 rounded-[28px] border-2 border-[#2c4167] focus-within:border-indigo-500 focus-within:bg-[#152a51] transition-all shadow-inner">
                      <label className="p-3 text-gray-400 hover:text-indigo-600 cursor-pointer active:scale-90 transition-all">
                        {isUploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                        <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
                      </label>
                      <textarea 
                        value={reply} 
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your official message..."
                        className="flex-1 bg-transparent border-none py-3 text-sm md:text-base focus:ring-0 outline-none resize-none min-h-[48px] max-h-40"
                        rows={1}
                        onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                      />
                      <button 
                        onClick={sendReply} 
                        disabled={isSending || isUploading || (!reply.trim() && !screenshot)}
                        className={`p-4 rounded-2xl shadow-xl transition-all flex items-center justify-center min-w-[56px] ${
                          isSending || isUploading || (!reply.trim() && !screenshot)
                          ? "bg-slate-700 text-slate-400"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95"
                        }`}
                      >
                        {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="rotate-45" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 bg-red-50 text-red-500 rounded-[28px] text-center font-black text-xs uppercase tracking-[3px] border-2 border-dashed border-red-100 flex items-center justify-center gap-3">
                    <Lock size={18} /> Ticket Closed for Responses
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 p-10 text-center">
            <div className="w-28 h-28 bg-[#0f1d38] shadow-xl rounded-[40px] flex items-center justify-center mb-8 border border-[#2c4167] animate-bounce transition-all duration-1000">
              <MessageSquare size={48} className="text-indigo-100 fill-indigo-50" />
            </div>
            <h3 className="text-2xl font-black text-gray-100 tracking-tight">Select conversation</h3>
            <p className="text-xs max-w-[240px] mt-3 font-bold uppercase tracking-widest text-gray-400 leading-loose">Choose a user ticket from the list to start responding.</p>
          </div>
        )}
      </div>
    </div>
  );
}
