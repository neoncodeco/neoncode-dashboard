"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import useAppAuth from "@/hooks/useAppAuth";
import Swal from "sweetalert2";
import { 
  Send, X, Lock, ShieldCheck, Image as ImageIcon, 
  Loader2, Search, MessageSquare, Clock, ChevronLeft 
} from "lucide-react";

export default function AdminSupportLayout() {
  const { token } = useAppAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  
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
      await Swal.fire({
        title: "Ticket closed",
        text: "This conversation is now closed for the user.",
        icon: "success",
        confirmButtonColor: "#2563eb",
        timer: 2000,
        showConfirmButton: true,
      });
    } catch (err) {
      console.error("Close ticket error:", err);
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
      text: "This will permanently remove the ticket and all messages. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete permanently",
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
      await Swal.fire({
        title: "Ticket deleted",
        text: "The ticket has been removed.",
        icon: "success",
        confirmButtonColor: "#2563eb",
        timer: 2000,
        showConfirmButton: true,
      });
    } catch (err) {
      console.error("Delete ticket error:", err);
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

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-transparent pt-16 text-slate-900 lg:h-screen lg:flex-row lg:pt-0 dark:text-white">
      
      <div className={`${selectedTicket ? "hidden lg:flex" : "flex"} h-full w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r lg:w-[350px] dark:border-[#2c4167] dark:bg-[#0f1d38]`}>
        <div className="border-b border-slate-200 bg-white p-5 dark:border-[#2c4167] dark:bg-[#0f1d38]">
          <h1 className="mb-4 text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-[#dce8ff]">Support Panel</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400" size={18} />
            <input 
              placeholder="Search conversations..." 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all shadow-inner focus:ring-2 focus:ring-sky-200 dark:border-[#2c4167] dark:bg-[#132546] dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:ring-indigo-500"
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
                className={`flex cursor-pointer items-center gap-4 border-b border-slate-100 p-5 transition-all dark:border-[#22375d] ${selectedTicket?._id === t._id ? "border-r-4 border-r-sky-500 bg-sky-50 shadow-sm dark:border-r-[#8ab4ff] dark:bg-[#1b2f57]" : "bg-white hover:bg-slate-50 dark:bg-[#14284d] dark:hover:bg-[#1a315d]"}`}
              >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${t.status === 'open' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-[#243a63] dark:text-[#9fb3de]'}`}>
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {t.departmentName ? (
                      <span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-sky-700 dark:bg-[#8ab4ff]/12 dark:text-[#c9dcff]">
                        {t.departmentName}
                      </span>
                    ) : null}
                    {t.priority ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:bg-[#45cf9b]/12 dark:text-[#a7f1d1]">
                        {t.priority}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`truncate text-sm font-extrabold ${selectedTicket?._id === t._id ? "text-sky-700 dark:text-[#8ab4ff]" : "text-slate-900 dark:text-gray-100"}`}>{t.subject}</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="truncate text-[12px] font-medium uppercase tracking-tighter text-slate-500 dark:text-gray-400">
                      User: {t.userName || "Unknown User"}{t.userId ? ` • ${t.userId.slice(-6)}` : ""}
                    </p>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${t.status === 'open' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200'}`}>
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
      <div className={`${!selectedTicket ? "hidden lg:flex" : "flex"} relative min-h-[calc(100svh-4rem)] lg:min-h-0 h-full w-full min-w-0 flex-1 flex-col bg-slate-50 dark:bg-[#0c1830]`}>
        {selectedTicket ? (
          <>
            {/* Header: Back Button visible on Mobile & Tablet (lg:hidden) */}
            <div className="z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-[#2c4167] dark:bg-[#0f1d38]">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedTicket(null)} 
                  className="lg:hidden -ml-2 rounded-2xl border border-transparent p-2.5 text-slate-600 transition-all hover:bg-slate-100 active:scale-90 dark:text-gray-200 dark:hover:bg-[#1b2f57]"
                >
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {selectedTicket.departmentName ? (
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-sky-700 dark:bg-[#8ab4ff]/12 dark:text-[#dce8ff]">
                        {selectedTicket.departmentName}
                      </span>
                    ) : null}
                    {selectedTicket.priority ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:bg-[#45cf9b]/12 dark:text-[#b8f3da]">
                        {selectedTicket.priority} priority
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-base font-black leading-tight tracking-tight text-slate-900 lg:text-lg dark:text-gray-100">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                    <span className="text-sky-600 dark:text-[#8ab4ff]">Official Support</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-gray-600" />
                    <span>{selectedTicket.userName || "Unknown User"}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-gray-600" />
                    <span>UID: {selectedTicket.userId}</span>
                  </div>
                </div>
              </div>
              <div className="ml-3 flex items-center gap-2">
                {selectedTicket.status !== "closed" ? (
                  <button
                    onClick={closeSelectedTicket}
                    disabled={isMutatingTicket}
                    className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200"
                  >
                    Close
                  </button>
                ) : null}
                <button
                  onClick={deleteSelectedTicket}
                  disabled={isMutatingTicket}
                  className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-200"
                >
                  Delete
                </button>
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
                        <div className="mb-1.5 flex items-center gap-2 px-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-400">
                            {isAdmin ? "Admin Response" : m.senderName || "End User"}
                          </span>
                          {isAdmin && <ShieldCheck size={14} className="fill-sky-100 text-sky-600 dark:fill-[#8ab4ff]/20 dark:text-[#8ab4ff]" />}
                        </div>
                        <div className={`p-4 md:p-5 rounded-[24px] text-sm md:text-[15px] shadow-sm leading-relaxed border transition-all ${
                          isAdmin ? "rounded-tr-none border-sky-200 bg-sky-500 text-white shadow-sky-200/40 dark:border-[#8ab4ff] dark:bg-[#6f95df] dark:text-[#081227] dark:shadow-[#2c53a0]/20" : "rounded-tl-none border-slate-200 bg-white text-slate-800 dark:border-[#2c4167] dark:bg-[#0f1d38] dark:text-gray-100"
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
            <div className="border-t border-slate-200 bg-white p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] sm:p-4 md:p-6 dark:border-[#2c4167] dark:bg-[#0f1d38] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.2)]">
              <div className="max-w-4xl mx-auto">
                {selectedTicket.status !== "closed" ? (
                  <div className="space-y-4">
                    {screenshot && (
                      <div className="relative inline-block animate-in zoom-in slide-in-from-bottom-3">
                        <img src={screenshot.url} className="h-24 w-24 rounded-2xl border-2 border-[#8ab4ff] object-cover shadow-xl ring-4 ring-[#8ab4ff]/10" alt="Reply attachment preview" />
                        <button onClick={() => setScreenshot(null)} className="absolute -right-3 -top-3 rounded-full border-2 border-white bg-red-500 p-2 text-white shadow-lg hover:bg-red-600 dark:border-[#132546]"><X size={12}/></button>
                      </div>
                    )}
                    <div className="flex items-end gap-2 rounded-[24px] border-2 border-slate-200 bg-slate-50 p-2.5 shadow-inner transition-all focus-within:border-sky-400 focus-within:bg-white sm:gap-3 sm:p-3 sm:rounded-[28px] dark:border-[#2c4167] dark:bg-[#132546] dark:focus-within:border-[#8ab4ff] dark:focus-within:bg-[#152a51]">
                      <label className="cursor-pointer p-3 text-slate-400 transition-all hover:text-sky-600 active:scale-90 dark:text-gray-400 dark:hover:text-[#8ab4ff]">
                        {isUploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                        <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
                      </label>
                      <textarea 
                        value={reply} 
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your official message..."
                        className="min-h-[48px] max-h-40 flex-1 resize-none border-none bg-transparent py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-0 md:text-base dark:text-white dark:placeholder:text-slate-400"
                        rows={1}
                        onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                      />
                      <button 
                        onClick={sendReply} 
                        disabled={isSending || isUploading || (!reply.trim() && !screenshot)}
                        className={`flex min-h-[56px] min-w-[56px] items-center justify-center rounded-2xl p-4 shadow-xl transition-all ${
                          isSending || isUploading || (!reply.trim() && !screenshot)
                          ? "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-400"
                          : "bg-sky-600 text-white hover:bg-sky-700 active:scale-95 dark:bg-[#8ab4ff] dark:text-[#081227] dark:hover:bg-[#9fc0ff] dark:hover:shadow-[#2c53a0]/30"
                        }`}
                      >
                        {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="rotate-45" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-red-400/20 bg-red-400/10 py-6 text-center text-xs font-black uppercase tracking-[3px] text-red-700 dark:text-red-200">
                    <Lock size={18} /> Ticket Closed for Responses
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-10 text-center text-slate-500 dark:text-gray-300">
            <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-[40px] border border-slate-200 bg-white shadow-xl transition-all duration-1000 dark:border-[#2c4167] dark:bg-[#0f1d38]">
              <MessageSquare size={48} className="fill-sky-100 text-sky-600 dark:fill-[#8ab4ff]/20 dark:text-[#dce8ff]" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-gray-100">Select conversation</h3>
            <p className="mt-3 max-w-[240px] text-xs font-bold uppercase tracking-widest leading-loose text-slate-400 dark:text-gray-400">Choose a user ticket from the list to start responding.</p>
          </div>
        )}
      </div>
    </div>
  );
}
