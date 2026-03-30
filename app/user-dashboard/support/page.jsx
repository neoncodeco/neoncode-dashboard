"use client";
import { useCallback, useEffect, useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import UserChatView from "./[ticketId]/page";
import CreateTicketPage from "./create/page";
import { MessageSquare, Plus } from "lucide-react";

export default function MyTicketsPage() {
  const { token } = useFirebaseAuth();
  const [tickets, setTickets] = useState([]);
  const [view, setView] = useState("list"); // list, create, chat
  const [activeTicketId, setActiveTicketId] = useState(null);

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/support/ticket/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTickets(data.data || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      void fetchTickets();
    }, 0);
    return () => clearTimeout(timer);
  }, [token, fetchTickets]);

  const handleBackToList = () => {
    setView("list");
    setActiveTicketId(null);
  };

  return (
    <div
      className="user-dashboard-theme-scope flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden pt-16 lg:m-2 lg:h-[calc(100vh-20px)] lg:flex-row lg:rounded-2xl lg:pt-0 xl:m-4"
      style={{
        border: "1px solid var(--dashboard-frame-border)",
        background: "var(--dashboard-page-bg)",
        color: "var(--dashboard-text-strong)",
      }}
    >
      
      {/* Sidebar */}
      <div className={`
        ${view !== "list" ? "hidden lg:flex" : "flex"} 
        w-full lg:w-[380px] xl:w-[420px] border-b lg:border-b-0 lg:border-r flex-col transition-all duration-300 min-w-0
      `}>
        <div
          className="px-4 py-4 sm:py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b"
          style={{
            borderColor: "var(--dashboard-frame-border)",
            background: "var(--dashboard-frame-bg)",
          }}
        >

          <div className="flex items-center  gap-3">
            <div className="dashboard-accent-surface p-2.5 rounded-xl shrink-0">
              <MessageSquare size={22} />
            </div>
            <div className="overflow-hidden">
              <h1 className="dashboard-text-strong text-lg sm:text-xl font-bold tracking-tight">Support</h1>
              <p className="dashboard-text-muted text-[11px] font-medium">Customer Help Desk</p>
            </div>
          </div>

          <button
            onClick={() => {
              setView("create");
              setActiveTicketId(null);
            }}
            className="dashboard-accent-surface px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Plus size={18} /> <span>New</span>
          </button>

        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2 space-y-2 min-w-0">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="dashboard-subpanel p-6 rounded-3xl mb-4">
                <MessageSquare size={40} className="dashboard-text-faint" />
              </div>
              <h3 className="dashboard-text-strong font-bold text-sm">No tickets found</h3>
              <p className="dashboard-text-muted text-xs mt-1">We couldn&apos;t find any support requests.</p>
            </div>
          ) : (
            tickets.map((t) => {
              const cleanId = typeof t._id === 'object' ? (t._id.$oid || t._id.toString()) : t._id;
              const isActive = activeTicketId === cleanId;
              return (
                <div
                  key={cleanId}
                  onClick={() => {
                    setActiveTicketId(cleanId);
                    setView("chat");
                  }}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border min-w-0 ${
                    isActive
                      ? "dashboard-subpanel scale-[1.01]"
                      : "border-transparent"
                  }`}
                  style={!isActive ? { background: "var(--dashboard-panel-soft)" } : undefined}
                >
                  {t.departmentName ? (
                    <div className="mb-2">
                      <span className="dashboard-chip px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em]">
                        {t.departmentName}
                      </span>
                    </div>
                  ) : null}
                  <div className="dashboard-text-strong font-bold text-sm truncate mb-2">{t.subject}</div>
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      t.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {t.status}
                    </span>
                    {t.priority ? (
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em]" style={{ background: "var(--dashboard-success-soft)", color: "var(--dashboard-text-strong)" }}>
                        {t.priority}
                      </span>
                    ) : null}
                    </div>
                    <span className="dashboard-text-muted text-[10px] font-bold uppercase">
                      {new Date(t.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`
        ${view === "list" ? "hidden lg:flex" : "flex"} 
        flex-1 flex-col w-full min-h-[calc(100svh-4rem)] lg:min-h-0 relative min-w-0
      `}>
        {view === "list" && (
          <div className="hidden lg:flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-500 text-center">
            <div className="dashboard-subpanel p-12 rounded-[40px] mb-6">
              <MessageSquare size={60} className="dashboard-text-faint" />
            </div>
            <h2 className="dashboard-text-strong text-2xl font-black">Select a conversation</h2>
            <p className="dashboard-text-muted text-sm mt-2 max-w-xs">Choose a ticket from the sidebar to start chatting.</p>
          </div>
        )}

        {view === "create" && (
          <div className="h-full overflow-hidden w-full">
            <CreateTicketPage
              onBack={handleBackToList}
              onSuccess={(newId) => {
                fetchTickets();
                setActiveTicketId(newId);
                setView("chat");
              }}
            />
          </div>
        )}

        {view === "chat" && activeTicketId && (
          <div className="h-full overflow-hidden w-full">
            <UserChatView
              key={activeTicketId}
              ticketIdFromProps={activeTicketId}
              onBack={handleBackToList}
            />
          </div>
        )}
      </div>
    </div>
  );
}
