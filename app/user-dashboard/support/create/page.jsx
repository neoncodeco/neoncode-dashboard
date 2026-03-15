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
    const data = await res.json();
    if (!res.ok || !data?.url) {
      throw new Error(data?.error || "Image upload failed");
    }
    return {
      url: data.url,
      ...(data.deleteUrl ? { deleteUrl: data.deleteUrl } : {}),
    };
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
    <div className="flex flex-col h-full bg-[#0c1830] relative overflow-hidden text-white">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10B981]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/10 rounded-full blur-[120px]" />

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-[#10213f]/90 backdrop-blur-md border-b border-[#22385f] flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button onClick={onBack} className="p-2.5 hover:bg-[#16294d] rounded-xl transition-all text-[#c8d6f0] border border-transparent hover:border-[#29456f]">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight">Create Ticket</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-[#8fa6cc] font-bold uppercase tracking-widest">Support Sync Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative z-10">
        <div className="max-w-3xl mx-auto">
          
          <div className="bg-[#10213f]/95 rounded-[32px] shadow-xl shadow-black/20 border border-[#22385f] overflow-hidden transition-all">
            <div className="p-1 bg-gradient-to-r from-[#10B981] to-blue-500" />
            
            <div className="p-5 sm:p-6 md:p-10 space-y-8">
              {/* Intro Text */}
                <div className="flex items-start gap-3 sm:gap-4 p-4 bg-[#0d1a32] rounded-2xl border border-[#22385f]">
                <div className="bg-[#16294d] p-2 rounded-lg shadow-sm">
                  <Sparkles size={20} className="text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Need help with something?</h3>
                  <p className="text-xs text-[#9db0cf] mt-0.5">Please provide as much detail as possible so we can assist you better.</p>
                </div>
              </div>

              {/* Subject Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-[#8fa6cc] uppercase tracking-[2px]">Problem Subject</label>
                  {subject.length > 0 && <span className="text-[10px] font-bold text-[#10B981]">Good</span>}
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8fa6cc] group-focus-within:text-[#10B981] transition-colors">
                    <AlertCircle size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter a descriptive subject..."
                    className="w-full bg-[#0d1a32] border-2 border-[#1a2f53] p-4 pl-12 rounded-2xl text-sm font-medium text-white placeholder:text-[#6f85ab] focus:bg-[#132547] focus:border-[#10B981] outline-none transition-all shadow-inner"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
              </div>

              {/* Message Input */}
              <div className="space-y-3">
                <label className="text-xs font-black text-[#8fa6cc] uppercase tracking-[2px] px-1">Detailed Description</label>
                <div className="relative group">
                  <div className="absolute left-4 top-5 text-[#8fa6cc] group-focus-within:text-[#10B981] transition-colors">
                    <MessageCircle size={18} />
                  </div>
                  <textarea
                    placeholder="Describe your issue here..."
                    className="w-full bg-[#0d1a32] border-2 border-[#1a2f53] p-4 pl-12 rounded-2xl text-sm font-medium text-white placeholder:text-[#6f85ab] focus:bg-[#132547] focus:border-[#10B981] outline-none transition-all shadow-inner min-h-[160px] resize-none"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <label className="text-xs font-black text-[#8fa6cc] uppercase tracking-[2px] px-1">Visual Evidence (Optional)</label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-[#16294d] shadow-md animate-in zoom-in duration-300">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      <button onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-black/50 backdrop-blur-md text-white p-1 rounded-full hover:bg-red-500 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {files.length < 4 && (
                    <label className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-[#29456f] bg-[#0d1a32] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all group">
                      <Upload size={20} className="text-[#8fa6cc] group-hover:text-[#10B981] transition-colors" />
                      <span className="text-[9px] font-bold text-[#8fa6cc] group-hover:text-[#10B981] uppercase tracking-tighter">Add</span>
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
                    ? "bg-[#16294d] text-[#7c92b7] cursor-not-allowed shadow-none"
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
