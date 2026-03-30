"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import LeadProjectPopup from "@/components/LeadProjectPopup";
import {
  getSupportDepartmentById,
  supportDepartments,
  supportPriorityOptions,
} from "@/lib/supportDepartments";

export default function CreateTicketPage({ onBack, onSuccess }) {
  const { token } = useFirebaseAuth();
  const router = useRouter();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [meetingOpen, setMeetingOpen] = useState(false);

  const selectedDepartment = useMemo(
    () => (selectedDepartmentId ? getSupportDepartmentById(selectedDepartmentId) : null),
    [selectedDepartmentId]
  );

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []).slice(0, 4 - files.length);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/upload/screenshot", {
      method: "POST",
      body: formData,
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

  const resetForm = () => {
    setSubject("");
    setPriority("Medium");
    setMessage("");
    setFiles([]);
    setSubmitError("");
  };

  const handleDepartmentSelect = (departmentId) => {
    setSelectedDepartmentId(departmentId);
    setSubmitError("");
  };

  const submit = async () => {
    if (!selectedDepartment || !subject.trim() || !message.trim()) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const uploaded = [];
      for (const file of files) {
        const data = await uploadImage(file);
        uploaded.push(data);
      }

      const res = await fetch("/api/support/ticket/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject,
          message,
          departmentId: selectedDepartment.id,
          priority,
          screenshots: uploaded,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Could not create ticket");
      }

      resetForm();
      onSuccess ? onSuccess(json.ticketId) : router.push(`/user-dashboard/support/${json.ticketId}`);
    } catch (error) {
      setSubmitError(error.message || "Could not create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="user-dashboard-theme-scope relative flex h-full flex-col overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, var(--dashboard-page-bg), var(--dashboard-page-bg))",
          color: "var(--dashboard-text-strong)",
        }}
      >
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-[#8ab4ff]/12 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-80 w-80 rounded-full bg-[#45cf9b]/10 blur-[140px]" />

        <div
          className="relative z-10 flex items-center justify-between border-b px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5"
          style={{
            borderColor: "var(--dashboard-frame-border)",
            background: "var(--dashboard-frame-bg)",
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={selectedDepartment ? () => setSelectedDepartmentId("") : onBack}
              className="rounded-xl border border-transparent p-2.5 text-[#c8d6f0] transition-all hover:border-[#29456f] hover:bg-[#16294d]"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black tracking-tight text-white sm:text-lg">
                {selectedDepartment ? selectedDepartment.name : "Support Center"}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa6cc]">
                {selectedDepartment ? "Open a new ticket" : "Choose the best help channel"}
              </p>
            </div>
          </div>

            <button
              type="button"
              onClick={() => setMeetingOpen(true)}
              className="dashboard-muted-button hidden rounded-2xl border px-4 py-2 text-sm font-bold transition sm:inline-flex sm:items-center sm:gap-2"
            >
            <CalendarDays size={16} />
            Book Meeting
          </button>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
          {!selectedDepartment ? (
            <div className="mx-auto max-w-6xl space-y-6">
              <section className="dashboard-subpanel rounded-[28px] p-5 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2d4a75] bg-[#0f1d38] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#9fb3de]">
                      <Sparkles size={12} />
                      Ticket Routing
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                      Open the right support lane in one click
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9db0cf]">
                      Pick a department below. We will open a matching ticket form and send it straight to the admin support panel.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMeetingOpen(true)}
                    className="dashboard-accent-surface inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition"
                  >
                    <CalendarDays size={16} />
                    Discovery Call
                  </button>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {supportDepartments.map((department) => (
                  <button
                    key={department.id}
                    type="button"
                    onClick={() => handleDepartmentSelect(department.id)}
                    className={`group dashboard-subpanel relative overflow-hidden rounded-[28px] p-6 text-left transition-all hover:-translate-y-1`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${department.accentClass} opacity-100`} />
                    <div className="relative z-10">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${department.badgeClass}`}>
                        Department
                      </span>
                      <h3 className="mt-5 text-2xl font-black tracking-tight text-white">{department.name}</h3>
                      <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#9db0cf]">{department.description}</p>
                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#dbe8ff]">
                        Open form
                        <ChevronRight size={16} className="transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setMeetingOpen(true)}
                  className="group dashboard-subpanel relative overflow-hidden rounded-[28px] p-6 text-left transition-all hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(69,207,155,0.18),transparent_45%)]" />
                  <div className="relative z-10">
                    <span className="inline-flex rounded-full bg-[#45cf9b]/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#8ce3bf]">
                      Live Booking
                    </span>
                    <h3 className="mt-5 text-2xl font-black tracking-tight text-white">Book a Meeting</h3>
                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#b6d3c7]">
                      Need live discussion? Open the same booking flow used by the Discovery Call option and choose a meeting time.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#dfffee]">
                      Open booking
                      <ChevronRight size={16} className="transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              </section>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl">
              <div className="dashboard-subpanel overflow-hidden rounded-[32px]">
                <div className="bg-gradient-to-r from-[#8ab4ff] via-[#45cf9b] to-[#9bcf5a] p-[1px]" />

                <div className="space-y-8 p-5 sm:p-6 md:p-8">
                  <div className="dashboard-subpanel flex flex-col gap-4 rounded-[24px] p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="dashboard-subpanel rounded-2xl p-3">
                        <CheckCircle2 size={20} className="text-[#8ab4ff]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">{selectedDepartment.name}</h3>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#9db0cf]">
                          {selectedDepartment.description}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${selectedDepartment.badgeClass}`}>
                      Admin Inbox Ready
                    </span>
                  </div>

                  {submitError ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <p>{submitError}</p>
                    </div>
                  ) : null}

                  <div className="grid gap-5 md:grid-cols-[1.6fr_0.8fr]">
                    <div className="space-y-3">
                      <label className="px-1 text-xs font-black uppercase tracking-[0.18em] text-[#8fa6cc]">
                        Subject
                      </label>
                      <div className="group relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8fa6cc] transition-colors group-focus-within:text-[#8ab4ff]">
                          <AlertCircle size={18} />
                        </div>
                        <input
                          type="text"
                          value={subject}
                          onChange={(event) => setSubject(event.target.value)}
                          placeholder={`Briefly describe your ${selectedDepartment.name.toLowerCase()} issue`}
                          className="w-full rounded-2xl border-2 border-[#1a2f53] bg-[#0d1a32] p-4 pl-12 text-sm font-medium text-white outline-none transition-all placeholder:text-[#6f85ab] focus:border-[#8ab4ff] focus:bg-[#132547]"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="px-1 text-xs font-black uppercase tracking-[0.18em] text-[#8fa6cc]">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(event) => setPriority(event.target.value)}
                        className="w-full rounded-2xl border-2 border-[#1a2f53] bg-[#0d1a32] p-4 text-sm font-semibold outline-none transition-all focus:border-[#8ab4ff] focus:bg-[#132547]"
                      >
                        {supportPriorityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="px-1 text-xs font-black uppercase tracking-[0.18em] text-[#8fa6cc]">
                      Message
                    </label>
                    <div className="group relative">
                      <div className="absolute left-4 top-5 text-[#8fa6cc] transition-colors group-focus-within:text-[#8ab4ff]">
                        <MessageCircle size={18} />
                      </div>
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Share all details, steps, screenshots, order info, or account info so admin can reply faster."
                        className="min-h-[180px] w-full resize-none rounded-2xl border-2 border-[#1a2f53] bg-[#0d1a32] p-4 pl-12 text-sm font-medium text-white outline-none transition-all placeholder:text-[#6f85ab] focus:border-[#8ab4ff] focus:bg-[#132547]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <label className="px-1 text-xs font-black uppercase tracking-[0.18em] text-[#8fa6cc]">
                        Attachments
                      </label>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f85ab]">
                        Up to 4 images
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="relative h-24 w-24 overflow-hidden rounded-2xl ring-4 ring-[#16294d]"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white transition hover:bg-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {files.length < 4 ? (
                        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#29456f] bg-[#0d1a32] transition-all hover:border-[#8ab4ff] hover:bg-[#12284c]">
                          <Paperclip size={18} className="text-[#8fa6cc]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8fa6cc]">
                            Add
                          </span>
                          <input type="file" hidden multiple accept="image/*" onChange={handleFileChange} />
                        </label>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMeetingOpen(true)}
                      className="dashboard-muted-button inline-flex items-center justify-center gap-2 rounded-[20px] border px-5 py-4 text-sm font-black transition"
                    >
                      <CalendarDays size={18} />
                      Book a Meeting Instead
                    </button>

                    <button
                      type="button"
                      onClick={submit}
                      disabled={isSubmitting || !subject.trim() || !message.trim()}
                      className={`inline-flex items-center justify-center gap-3 rounded-[20px] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] transition-all ${
                        isSubmitting || !subject.trim() || !message.trim()
                          ? "cursor-not-allowed dashboard-muted-button border"
                          : "dashboard-accent-surface"
                      }`}
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      {isSubmitting ? "Submitting" : "Submit Ticket"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {meetingOpen ? (
        <LeadProjectPopup
          open={meetingOpen}
          onClose={() => setMeetingOpen(false)}
          meetingOnly
          title="Book Discovery Call"
        />
      ) : null}
    </>
  );
}
