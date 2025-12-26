"use client";
import { useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Upload, X, Loader2, Sparkles, MessageCircle, AlertCircle } from "lucide-react";

export default function CreateTicketPage({ onBack, onSuccess }) {
  const { token } = useFirebaseAuth();
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/upload/screenshot", {
      method: "POST",
      body: fd,
    });
    return res.json();
  };

  const submit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setIsSubmitting(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const data = await uploadImage(file);
        uploaded.push(data);
      }
      const res = await fetch("/api/support/ticket/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, message, screenshots: uploaded }),
      });
      const json = await res.json();
      if (res.ok) {
        onSuccess ? onSuccess(json.ticketId) : router.push(`/user-dashboard/support/${json.ticketId}`);
      }
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10B981]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

      {/* Header */}
      <div className="px-6 py-5 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-600 border border-transparent hover:border-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-800 tracking-tight">Create Ticket</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Support Sync Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10 relative z-10">
        <div className="max-w-3xl mx-auto">
          
          <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden transition-all">
            <div className="p-1 bg-gradient-to-r from-[#10B981] to-blue-500" />
            
            <div className="p-6 md:p-10 space-y-8">
              {/* Intro Text */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Sparkles size={20} className="text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Need help with something?</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Please provide as much detail as possible so we can assist you better.</p>
                </div>
              </div>

              {/* Subject Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[2px]">Problem Subject</label>
                  {subject.length > 0 && <span className="text-[10px] font-bold text-[#10B981]">Good</span>}
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#10B981] transition-colors">
                    <AlertCircle size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter a descriptive subject..."
                    className="w-full bg-gray-50 border-2 border-gray-50 p-4 pl-12 rounded-2xl text-sm font-medium focus:bg-white focus:border-[#10B981] outline-none transition-all shadow-inner"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
              </div>

              {/* Message Input */}
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[2px] px-1">Detailed Description</label>
                <div className="relative group">
                  <div className="absolute left-4 top-5 text-gray-400 group-focus-within:text-[#10B981] transition-colors">
                    <MessageCircle size={18} />
                  </div>
                  <textarea
                    placeholder="Describe your issue here..."
                    className="w-full bg-gray-50 border-2 border-gray-50 p-4 pl-12 rounded-2xl text-sm font-medium focus:bg-white focus:border-[#10B981] outline-none transition-all shadow-inner min-h-[160px] resize-none"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[2px] px-1">Visual Evidence (Optional)</label>
                <div className="flex flex-wrap gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-gray-50 shadow-md animate-in zoom-in duration-300">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      <button onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-black/50 backdrop-blur-md text-white p-1 rounded-full hover:bg-red-500 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {files.length < 4 && (
                    <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all group">
                      <Upload size={20} className="text-gray-400 group-hover:text-[#10B981] transition-colors" />
                      <span className="text-[9px] font-bold text-gray-400 group-hover:text-[#10B981] uppercase tracking-tighter">Add</span>
                      <input type="file" multiple hidden accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  onClick={submit}
                  disabled={isSubmitting || !subject || !message}
                  className={`w-full py-5 rounded-[20px] flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all shadow-xl ${
                    isSubmitting || !subject || !message
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-[#10B981] text-white hover:bg-[#0da371] hover:translate-y-[-2px] active:translate-y-[0px] shadow-[#10B981]/30"
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span>Open Ticket</span>
                      <Send size={18} className="rotate-45" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <p className="text-center mt-8 text-gray-400 text-[10px] font-bold uppercase tracking-[2px]">Secure Support Channel • 24/7 Monitoring</p>
        </div>
      </div>
    </div>
  );
}