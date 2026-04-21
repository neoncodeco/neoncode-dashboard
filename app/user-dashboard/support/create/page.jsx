"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import LeadProjectPopup from "@/components/LeadProjectPopup";
import {
  getSupportDepartmentById,
  supportDepartments,
  supportPriorityOptions,
} from "@/lib/supportDepartments";

export default function CreateTicketPage({ onSuccess }) {
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

        <div className="relative z-10 flex-1 rounded overflow-y-auto px-0 pb-4 pt-0 md:px-0 md:pb-8 md:pt-0">
          {!selectedDepartment ? (
            <div className="w-full space-y-6">
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
                      <h3 className="dashboard-text-strong mt-5 text-2xl font-black tracking-tight">{department.name}</h3>
                      <p className="dashboard-text-muted mt-3 min-h-[72px] text-sm leading-6">{department.description}</p>
                      <div className="dashboard-text-strong mt-6 inline-flex items-center gap-2 text-sm font-bold">
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
                    <span className="inline-flex rounded-full bg-[#45cf9b]/22 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#1e6247]">
                      Live Booking
                    </span>
                    <h3 className="dashboard-text-strong mt-5 text-2xl font-black tracking-tight">Book a Meeting</h3>
                    <p className="dashboard-text-muted mt-3 min-h-[72px] text-sm leading-6">
                      Need live discussion? Open the same booking flow used by the Discovery Call option and choose a meeting time.
                    </p>
                    <div className="dashboard-text-strong mt-6 inline-flex items-center gap-2 text-sm font-bold">
                      Open booking
                      <ChevronRight size={16} className="transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              </section>
            </div>
          ) : (
            <div className="w-full">
              <div className="mt-4 overflow-hidden rounded-[20px] border sm:mt-5 sm:rounded-[24px]">
                <div className="space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-8">
                  <button
                    type="button"
                    onClick={() => setSelectedDepartmentId("")}
                    className="dashboard-muted-button inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] sm:w-auto"
                  >
                    <ChevronLeft size={14} />
                    Back to Departments
                  </button>

                  <div className="dashboard-panel flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="dashboard-accent-surface rounded-none p-3 text-white">
                        <CheckCircle2 size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="dashboard-text-strong text-lg font-black">{selectedDepartment.name}</h3>
                        <p className="dashboard-text-muted mt-1 max-w-2xl text-sm leading-6">
                          {selectedDepartment.description}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${selectedDepartment.badgeClass}`}>
                      Admin Inbox Ready
                    </span>
                  </div>

                  {submitError ? (
                    <div className="flex items-start gap-3 rounded-none border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <p>{submitError}</p>
                    </div>
                  ) : null}

                  <div className="grid gap-5 md:grid-cols-12">
                    <div className="space-y-3 md:col-span-9 xl:col-span-7">
                      <label className="dashboard-text-faint px-1 text-xs font-black uppercase tracking-[0.18em]">
                        Subject
                      </label>
                      <div className="group relative">
                        <div className="dashboard-text-faint absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[var(--dashboard-accent-strong)]">
                          <AlertCircle size={18} />
                        </div>
                        <input
                          type="text"
                          value={subject}
                          onChange={(event) => setSubject(event.target.value)}
                          placeholder={`Briefly describe your ${selectedDepartment.name.toLowerCase()} issue`}
                          className="w-full rounded-xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] p-4 pl-12 text-sm font-semibold text-[var(--dashboard-text-strong)] outline-none transition-all placeholder:text-[var(--dashboard-placeholder)] focus:border-[var(--dashboard-accent-strong)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-3 xl:col-span-3">
                      <label className="dashboard-text-faint px-1 text-xs font-black uppercase tracking-[0.18em]">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(event) => setPriority(event.target.value)}
                        className="w-full rounded-xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] p-4 text-sm font-semibold text-[var(--dashboard-text-strong)] outline-none transition-all focus:border-[var(--dashboard-accent-strong)]"
                      >
                        {supportPriorityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="hidden space-y-3 xl:block xl:col-span-2">
                      <label className="dashboard-text-faint px-1 text-xs font-black uppercase tracking-[0.18em]">
                        Department
                      </label>
                      <div className="dashboard-subpanel flex h-[54px] items-center rounded-xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] px-4">
                        <span className="dashboard-text-strong truncate text-sm font-semibold">{selectedDepartment.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="dashboard-text-faint px-1 text-xs font-black uppercase tracking-[0.18em]">
                      Message
                    </label>
                    <div className="group relative">
                      <div className="dashboard-text-faint absolute left-4 top-5 transition-colors group-focus-within:text-[var(--dashboard-accent-strong)]">
                        <MessageCircle size={18} />
                      </div>
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Share all details, steps, screenshots, order info, or account info so admin can reply faster."
                        className="min-h-[180px] w-full resize-none rounded-xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] p-4 pl-12 text-sm font-semibold text-[var(--dashboard-text-strong)] outline-none transition-all placeholder:text-[var(--dashboard-placeholder)] focus:border-[var(--dashboard-accent-strong)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {files.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {files.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="relative h-16 w-16 overflow-hidden rounded-xl ring-2 ring-[var(--dashboard-input-border)]"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute right-0.5 top-0.5 rounded-md bg-black/55 p-0.5 text-white transition hover:bg-red-500"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:overflow-x-auto sm:whitespace-nowrap sm:pb-1">
                      {files.length < 4 ? (
                        <label className="dashboard-subpanel inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] px-3 text-[10px] font-black uppercase tracking-[0.14em] transition-all hover:border-[var(--dashboard-accent-strong)] sm:ml-1 sm:min-w-[88px] sm:w-auto">
                          <Paperclip size={12} className="dashboard-text-faint" />
                          <span className="dashboard-text-faint">Add</span>
                          <input type="file" hidden multiple accept="image/*" onChange={handleFileChange} />
                        </label>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setMeetingOpen(true)}
                        className="dashboard-muted-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-black transition sm:ml-1 sm:min-w-[210px] sm:w-auto"
                      >
                        <CalendarDays size={16} />
                        Book a Meeting Instead
                      </button>

                      <button
                        type="button"
                        onClick={submit}
                        disabled={isSubmitting || !subject.trim() || !message.trim()}
                        className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-black uppercase tracking-[0.14em] transition-all sm:min-w-[180px] sm:w-auto ${
                          isSubmitting || !subject.trim() || !message.trim()
                            ? "cursor-not-allowed dashboard-muted-button border"
                            : "dashboard-accent-surface"
                        }`}
                      >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {isSubmitting ? "Submitting" : "Submit Ticket"}
                      </button>
                    </div>
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
