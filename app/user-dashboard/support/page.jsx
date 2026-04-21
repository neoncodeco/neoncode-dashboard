"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import CreateTicketPage from "./create/page";
import LeadProjectPopup from "@/components/LeadProjectPopup";
import { BadgeCheck, CalendarDays, Clock3, History, Loader2, MessagesSquare, Paperclip, Plus, Send, X } from "lucide-react";

export default function MyTicketsPage() {
  const { token } = useFirebaseAuth();
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("create");
  const [expandedTicketIds, setExpandedTicketIds] = useState({});
  const [ticketDetailsById, setTicketDetailsById] = useState({});
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState(null);
  const [replyDraftsByTicket, setReplyDraftsByTicket] = useState({});
  const [isUploadingReplyByTicket, setIsUploadingReplyByTicket] = useState({});
  const [isSendingReplyByTicket, setIsSendingReplyByTicket] = useState({});
  const [meetingOpen, setMeetingOpen] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    setIsLoadingTickets(true);
    try {
      const res = await fetch("/api/support/ticket/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      void fetchTickets();
    }, 0);
    return () => clearTimeout(timer);
  }, [token, fetchTickets]);

  const normalizeTicketId = (value) => {
    if (!value) return "";
    return typeof value === "object" ? value.$oid || value.toString() : value.toString();
  };

  const historyTickets = useMemo(() => {
    return [...tickets].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [tickets]);

  const formatDateTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return `${date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} • ${date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  };

  const getStatusStyle = (status) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "open" || normalized === "pending") {
      return "border-emerald-300/50 bg-emerald-100/80 text-emerald-700";
    }
    if (normalized === "closed" || normalized === "resolved") {
      return "border-slate-300/50 bg-slate-100/80 text-slate-700";
    }
    return "border-sky-300/50 bg-sky-100/70 text-sky-700";
  };

  const isTicketOpen = (status) => {
    const normalized = (status || "").toLowerCase();
    return normalized !== "closed" && normalized !== "resolved";
  };

  const uploadScreenshot = async (file) => {
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

  const loadTicketDetails = useCallback(
    async (ticketId, forceRefresh = false) => {
      if (!token || !ticketId) return;
      const normalizedId = normalizeTicketId(ticketId);
      if (!normalizedId || (!forceRefresh && ticketDetailsById[normalizedId])) return;

      setLoadingDetailId(normalizedId);
      try {
        const res = await fetch(`/api/support/ticket/${normalizedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) {
          setTicketDetailsById((prev) => ({
            ...prev,
            [normalizedId]: json.data,
          }));
        }
      } catch (error) {
        console.error("Failed to load ticket details", error);
      } finally {
        setLoadingDetailId(null);
      }
    },
    [token, ticketDetailsById]
  );

  const toggleComments = async (ticketId, status) => {
    const normalizedId = normalizeTicketId(ticketId);
    if (!normalizedId) return;

    const defaultExpanded = isTicketOpen(status);
    const currentExpanded = expandedTicketIds[normalizedId] ?? defaultExpanded;
    const nextExpanded = !currentExpanded;

    setExpandedTicketIds((prev) => ({
      ...prev,
      [normalizedId]: nextExpanded,
    }));

    if (nextExpanded && !ticketDetailsById[normalizedId]) {
      await loadTicketDetails(normalizedId);
    }
  };

  useEffect(() => {
    if (activeTab !== "history") return;
    const openTicketIds = historyTickets
      .filter((ticket) => isTicketOpen(ticket.status))
      .map((ticket) => normalizeTicketId(ticket._id))
      .filter(Boolean);

    openTicketIds.forEach((ticketId) => {
      if (!ticketDetailsById[ticketId]) {
        void loadTicketDetails(ticketId);
      }
    });
  }, [activeTab, historyTickets, ticketDetailsById, loadTicketDetails]);

  const setReplyText = (ticketId, text) => {
    setReplyDraftsByTicket((prev) => ({
      ...prev,
      [ticketId]: {
        text,
        files: prev[ticketId]?.files || [],
      },
    }));
  };

  const addReplyFiles = (ticketId, incomingFiles) => {
    const selected = Array.from(incomingFiles || []);
    if (!selected.length) return;
    setReplyDraftsByTicket((prev) => {
      const current = prev[ticketId] || { text: "", files: [] };
      const files = [...current.files, ...selected].slice(0, 4);
      return {
        ...prev,
        [ticketId]: {
          text: current.text,
          files,
        },
      };
    });
  };

  const removeReplyFile = (ticketId, fileIndex) => {
    setReplyDraftsByTicket((prev) => {
      const current = prev[ticketId] || { text: "", files: [] };
      return {
        ...prev,
        [ticketId]: {
          text: current.text,
          files: current.files.filter((_, index) => index !== fileIndex),
        },
      };
    });
  };

  const sendReply = async (ticketId, status) => {
    if (!token || !ticketId || !isTicketOpen(status)) return;
    const draft = replyDraftsByTicket[ticketId] || { text: "", files: [] };
    const hasText = draft.text?.trim().length > 0;
    const hasFiles = draft.files?.length > 0;
    if (!hasText && !hasFiles) return;

    setIsSendingReplyByTicket((prev) => ({ ...prev, [ticketId]: true }));
    try {
      let screenshots = [];
      if (hasFiles) {
        setIsUploadingReplyByTicket((prev) => ({ ...prev, [ticketId]: true }));
        screenshots = [];
        for (const file of draft.files) {
          const uploaded = await uploadScreenshot(file);
          screenshots.push(uploaded);
        }
      }

      const res = await fetch("/api/support/ticket/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ticketId,
          text: draft.text || "",
          screenshots,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send reply");
      }

      setReplyDraftsByTicket((prev) => ({
        ...prev,
        [ticketId]: { text: "", files: [] },
      }));

      await Promise.all([loadTicketDetails(ticketId, true), fetchTickets()]);
    } catch (error) {
      console.error("Failed to send support reply", error);
    } finally {
      setIsUploadingReplyByTicket((prev) => ({ ...prev, [ticketId]: false }));
      setIsSendingReplyByTicket((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  return (
    <div className="user-dashboard-theme-scope min-h-screen space-y-5 bg-transparent p-3 sm:p-4 lg:p-6">
      <div className="dashboard-subpanel mt-4 flex flex-col gap-4 rounded-[24px] border border-sky-300/35 bg-[linear-gradient(135deg,rgba(115,200,255,0.24),rgba(183,223,105,0.14)_52%,rgba(255,255,255,0.94))] p-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-[28px] sm:p-6">
        <div>
          <p className="dashboard-text-faint text-[10px] font-black uppercase tracking-[0.2em]">Support</p>
          <h1 className="dashboard-text-strong mt-2 text-2xl font-black tracking-tight sm:text-3xl">Support Center</h1>
          <p className="dashboard-text-muted mt-2 text-sm">Create new ticket অথবা history থেকে আগের ticket comments দেখুন।</p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:ml-auto sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition sm:w-auto ${
              activeTab === "create" ? "dashboard-accent-surface" : "dashboard-muted-button border"
            }`}
          >
            <Plus size={16} />
            New Ticket
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition sm:w-auto ${
              activeTab === "history" ? "dashboard-accent-surface" : "dashboard-muted-button border"
            }`}
          >
            <History size={16} />
            History
          </button>

          {activeTab === "create" ? (
            <button
              type="button"
              onClick={() => setMeetingOpen(true)}
              className="dashboard-muted-button inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition sm:w-auto"
            >
              <CalendarDays size={16} />
              Discovery Call
            </button>
          ) : null}
        </div>
      </div>

      {activeTab === "create" ? (
        <div className="dashboard-panel min-h-[calc(100svh-12rem)] overflow-hidden rounded-[22px] border border-emerald-300/30 bg-[linear-gradient(135deg,rgba(183,223,105,0.16),rgba(115,200,255,0.1)_55%,rgba(255,255,255,0.9))] sm:rounded-[28px]">
          <CreateTicketPage
            onSuccess={async (newId) => {
              await fetchTickets();
              const normalizedId = normalizeTicketId(newId);
              setActiveTab("history");
              setExpandedTicketIds((prev) => ({
                ...prev,
                [normalizedId]: true,
              }));
              if (normalizedId) {
                await loadTicketDetails(normalizedId);
              }
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {isLoadingTickets ? (
            <div className="dashboard-subpanel flex min-h-[220px] items-center justify-center rounded-[24px] border border-sky-300/35 bg-[linear-gradient(135deg,rgba(115,200,255,0.22),rgba(255,255,255,0.92)_58%)] p-6 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="animate-spin dashboard-text-muted" />
                <span className="dashboard-text-muted text-sm font-semibold">Loading ticket history...</span>
              </div>
            </div>
          ) : historyTickets.length === 0 ? (
            <div className="dashboard-subpanel flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-emerald-300/35 bg-[linear-gradient(135deg,rgba(183,223,105,0.24),rgba(255,255,255,0.92)_58%)] p-6 text-center shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
              <MessagesSquare size={28} className="dashboard-text-faint" />
              <p className="dashboard-text-strong mt-4 text-base font-bold">No support history found</p>
              <p className="dashboard-text-muted mt-1 text-sm">আপনার created ticket history এখানে comment-style এ দেখাবে।</p>
            </div>
          ) : (
            historyTickets.map((ticket) => {
              const ticketId = normalizeTicketId(ticket._id);
              const details = ticketDetailsById[ticketId];
              const messages = details?.messages || [];
              const isOpenStatus = isTicketOpen(ticket.status);
              const isExpanded = expandedTicketIds[ticketId] ?? isOpenStatus;
              const isLoadingDetail = loadingDetailId === ticketId;
              const replyDraft = replyDraftsByTicket[ticketId] || { text: "", files: [] };
              const isSendingReply = Boolean(isSendingReplyByTicket[ticketId]);
              const isUploadingReply = Boolean(isUploadingReplyByTicket[ticketId]);

              return (
                <div key={ticketId} className="rounded-[20px] border border-sky-300/55 bg-[linear-gradient(140deg,rgba(255,255,255,0.98),rgba(223,244,255,0.76)_45%,rgba(235,250,220,0.7))] p-4 shadow-[0_16px_38px_rgba(15,23,42,0.08)] sm:rounded-[24px] sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {ticket.departmentName ? (
                          <span className="dashboard-chip border border-indigo-300/45 bg-indigo-100/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-700">
                            {ticket.departmentName}
                          </span>
                        ) : null}
                        {ticket.priority ? (
                          <span className="inline-flex items-center rounded-full border border-violet-300/50 bg-violet-100/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">
                            {ticket.priority} Priority
                          </span>
                        ) : null}
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getStatusStyle(ticket.status)}`}>
                          {ticket.status || "Unknown"}
                        </span>
                      </div>

                      <h3 className="dashboard-text-strong truncate text-lg font-black tracking-tight"> Title: {ticket.subject || "Untitled Ticket"}</h3>
                      <p className="dashboard-text-muted mt-1 text-xs font-semibold uppercase tracking-[0.1em]">
                        Ticket ID: {ticketId.slice(-6)} • Updated {formatDateTime(ticket.updatedAt || ticket.createdAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleComments(ticketId, ticket.status)}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all sm:w-auto ${
                        isOpenStatus
                          ? "border-emerald-300/50 bg-emerald-100/80 text-emerald-700 shadow-[0_8px_20px_rgba(16,185,129,0.12)]"
                          : "dashboard-muted-button hover:border-sky-300/45 hover:bg-sky-100/60"
                      }`}
                    >
                      <MessagesSquare size={14} />
                      {isExpanded ? "Hide Comments" : "Show Comments"}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 space-y-3 border-t border-[var(--dashboard-frame-border)] pt-4">
                      {isLoadingDetail ? (
                        <div className="flex items-center gap-2 py-3">
                          <Loader2 size={15} className="animate-spin dashboard-text-muted" />
                          <span className="dashboard-text-muted text-sm font-semibold">Loading comments...</span>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="dashboard-subpanel rounded-2xl border border-dashed bg-[var(--dashboard-panel-soft)] p-4">
                          <p className="dashboard-text-muted text-sm font-semibold">No comments on this ticket yet.</p>
                        </div>
                      ) : (
                        messages.map((message, index) => {
                          const isAdmin = message.senderRole && message.senderRole !== "user";
                          return (
                            <div
                              key={`${ticketId}-${index}`}
                              className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)] ${
                                isAdmin
                                  ? "border-sky-300/55 bg-[linear-gradient(140deg,rgba(186,230,253,0.44),rgba(255,255,255,0.94)_52%)]"
                                  : "border-emerald-300/55 bg-[linear-gradient(140deg,rgba(190,242,211,0.46),rgba(255,255,255,0.94)_55%)]"
                              }`}
                            >
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="dashboard-text-strong text-sm font-black">
                                    {message.senderName || (isAdmin ? "Support Team" : "You")}
                                  </span>
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                                    isAdmin ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"
                                  }`}>
                                    {isAdmin ? "Admin" : "User"}
                                  </span>
                                </div>

                                <span className="dashboard-text-muted inline-flex items-center gap-1 text-xs font-semibold">
                                  <Clock3 size={12} />
                                  {formatDateTime(message.createdAt || message.updatedAt || ticket.updatedAt)}
                                </span>
                              </div>

                              <p className="dashboard-text-strong whitespace-pre-wrap text-sm leading-6">
                                {message.text?.trim() || "Attachment added."}
                              </p>

                              {Array.isArray(message.screenshots) && message.screenshots.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {message.screenshots.map((shot, screenshotIndex) => (
                                    <a
                                      key={`${ticketId}-shot-${screenshotIndex}`}
                                      href={shot.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-xl border border-sky-300/50 bg-sky-100/60 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-200/60"
                                    >
                                      <BadgeCheck size={12} />
                                      Attachment {screenshotIndex + 1}
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}

                      {isOpenStatus ? (
                        <div className="dashboard-panel mt-4 rounded-2xl border border-emerald-300/55 bg-[linear-gradient(140deg,rgba(190,242,211,0.38),rgba(255,255,255,0.96)_55%)] p-3 sm:p-4">
                          <p className="dashboard-text-faint mb-2 text-[10px] font-black uppercase tracking-[0.18em]">Add Reply</p>

                          {replyDraft.files.length > 0 ? (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {replyDraft.files.map((file, fileIndex) => (
                                <span
                                  key={`${ticketId}-file-${fileIndex}`}
                                  className="inline-flex items-center gap-1  bg-indigo-100/60 px-3 py-1 text-xs font-semibold text-indigo-700"
                                >
                                  {file.name}
                                  <button
                                    type="button"
                                    onClick={() => removeReplyFile(ticketId, fileIndex)}
                                    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-rose-700"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div className="flex min-h-[52px] flex-1 items-end rounded-xl bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                              <textarea
                                value={replyDraft.text}
                                onChange={(event) => setReplyText(ticketId, event.target.value)}
                                placeholder="Write your reply..."
                                className="max-h-40 min-h-[34px] w-full resize-none border-0 bg-transparent p-3 text-sm focus:ring-0"
                                rows={1}
                                onInput={(event) => {
                                  event.target.style.height = "auto";
                                  event.target.style.height = `${event.target.scrollHeight}px`;
                                }}
                              />
                            </div>

                            <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-300/50 bg-sky-100/65 px-4 text-sm font-bold text-sky-700 transition hover:bg-sky-200/65 sm:w-auto">
                              <Paperclip size={15} />
                              Attach
                              <input
                                type="file"
                                hidden
                                multiple
                                accept="image/*"
                                onChange={(event) => {
                                  addReplyFiles(ticketId, event.target.files);
                                  event.target.value = "";
                                }}
                                disabled={isSendingReply || isUploadingReply}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => sendReply(ticketId, ticket.status)}
                              disabled={isSendingReply || isUploadingReply || (!replyDraft.text.trim() && replyDraft.files.length === 0)}
                              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition-all sm:w-auto ${
                                isSendingReply || isUploadingReply || (!replyDraft.text.trim() && replyDraft.files.length === 0)
                                  ? "dashboard-muted-button border"
                                  : "dashboard-accent-surface shadow-[0_12px_26px_rgba(163,201,74,0.25)] hover:brightness-105"
                              }`}
                            >
                              {isSendingReply || isUploadingReply ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                              Reply
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      )}

      {meetingOpen ? (
        <LeadProjectPopup
          open={meetingOpen}
          onClose={() => setMeetingOpen(false)}
          meetingOnly
          title="Book Discovery Call"
        />
      ) : null}
    </div>
  );
}
