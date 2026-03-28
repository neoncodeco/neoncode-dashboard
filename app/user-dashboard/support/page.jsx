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
    <div className="flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden pt-16 lg:h-[calc(100vh-20px)] lg:flex-row lg:pt-0 lg:m-2 xl:m-4 lg:rounded-2xl border-none lg:border border-[#2c4167] shadow-none text-black bg-[linear-gradient(180deg,#081227_0%,#0d1d3b_100%)]">
      
      {/* Sidebar */}
      <div className={`
        ${view !== "list" ? "hidden lg:flex" : "flex"} 
        w-full lg:w-[380px] xl:w-[420px] border-b lg:border-b-0 lg:border-r border-[#2c4167] flex-col bg-[#0f1d38] transition-all duration-300 min-w-0
      `}>
        <div className="px-4 py-4 sm:py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-gray-200">

          <div className="flex items-center  gap-3">
            <div className="bg-[#10B981] p-2.5 rounded-xl shrink-0">
              <MessageSquare size={22} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight">Support</h1>
              <p className="text-[11px] text-gray-500 font-medium">Customer Help Desk</p>
            </div>
          </div>

          <button
            onClick={() => {
              setView("create");
              setActiveTicketId(null);
            }}
            className="bg-[#10B981] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0da371] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-green-100 w-full sm:w-auto"
          >
            <Plus size={18} /> <span>New</span>
          </button>

        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2 space-y-2 min-w-0">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-50 p-6 rounded-3xl mb-4">
                <MessageSquare size={40} className="text-gray-200" />
              </div>
              <h3 className="text-gray-800 font-bold text-sm">No tickets found</h3>
              <p className="text-xs text-gray-400 mt-1">We couldn&apos;t find any support requests.</p>
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
                      ? "bg-white border-gray-200 shadow-lg scale-[1.01] ring-1 ring-black/5"
                      : " border-transparent bg-gray-100"
                  }`}
                >
                  <div className="font-bold text-sm text-gray-800 truncate mb-2">{t.subject}</div>
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      t.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
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
        flex-1 flex-col bg-[#0c1830] w-full min-h-[calc(100svh-4rem)] lg:min-h-0 relative min-w-0
      `}>
        {view === "list" && (
          <div className="hidden lg:flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-500 text-center">
            <div className="bg-[#F8FAFC] p-12 rounded-[40px] mb-6 shadow-inner">
              <MessageSquare size={60} className="text-[#CBD5E1]" />
            </div>
            <h2 className="text-2xl font-black text-gray-800">Select a conversation</h2>
            <p className="text-gray-400 text-sm mt-2 max-w-xs">Choose a ticket from the sidebar to start chatting.</p>
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
