"use client";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import React, { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Clock3, History, Sparkles } from "lucide-react";

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useFirebaseAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.ok) setHistory(data.data);
      } catch (err) {
        console.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "active":
      case "success":
      case "completed":
        return "border-emerald-300/50 bg-emerald-100/70 text-emerald-700";
      case "pending":
      case "open":
        return "border-amber-300/50 bg-amber-100/70 text-amber-700";
      case "rejected":
      case "failed":
        return "border-rose-300/50 bg-rose-100/70 text-rose-700";
      default:
        return "border-slate-300/50 bg-slate-100/80 text-slate-700";
    }
  };

  const formatHistoryDateTime = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return { date: "--", time: "--" };
    }

    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const formatAmount = (value) => {
    const amount = Number(value || 0);
    return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  };

  const totalItems = history.length;
  const pendingItems = history.filter((item) => {
    const normalized = item.status?.toLowerCase();
    return normalized === "pending" || normalized === "open";
  }).length;
  const completedItems = history.filter((item) => {
    const normalized = item.status?.toLowerCase();
    return normalized === "approved" || normalized === "active" || normalized === "success" || normalized === "completed";
  }).length;

  if (loading) {
    return (
      <div className="user-dashboard-theme-scope flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-transparent">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[var(--dashboard-accent)]" />
        <p className="dashboard-text-muted text-sm font-semibold">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-theme-scope min-h-screen space-y-6 bg-transparent p-3 sm:p-4 lg:p-6">
      <div className="dashboard-subpanel mt-4 rounded-[32px] border border-white/10 p-5 sm:p-6">
        <div className="max-w-3xl">
          <p className="dashboard-text-faint text-[10px] font-black uppercase tracking-[0.28em]">History</p>
          <h1 className="dashboard-text-strong mt-2 text-3xl font-black tracking-tight md:text-4xl">Activity History</h1>
          <p className="dashboard-text-muted mt-3 text-sm leading-6">Track your recent requests, updates, and current status from one place.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dashboard-subpanel rounded-[24px] border p-4 shadow-[0_16px_38px_rgba(15,23,42,0.08)] !border-sky-300/45 !bg-[linear-gradient(135deg,rgba(115,200,255,0.28),rgba(115,200,255,0.12)_50%,rgba(255,255,255,0.96))]">
          <div className="flex items-center gap-3">
            <span className="dashboard-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl text-white">
              <History size={17} />
            </span>
            <div>
              <p className="dashboard-text-faint text-[10px] font-black uppercase tracking-[0.18em]">Total</p>
              <p className="dashboard-text-strong text-xl font-black">{totalItems}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-subpanel rounded-[24px] border p-4 shadow-[0_16px_38px_rgba(15,23,42,0.08)] !border-amber-300/50 !bg-[linear-gradient(135deg,rgba(251,191,36,0.24),rgba(251,191,36,0.1)_50%,rgba(255,255,255,0.96))]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Clock3 size={17} />
            </span>
            <div>
              <p className="dashboard-text-faint text-[10px] font-black uppercase tracking-[0.18em]">Pending</p>
              <p className="dashboard-text-strong text-xl font-black">{pendingItems}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-subpanel rounded-[24px] border p-4 shadow-[0_16px_38px_rgba(15,23,42,0.08)] !border-emerald-300/50 !bg-[linear-gradient(135deg,rgba(183,223,105,0.34),rgba(183,223,105,0.12)_48%,rgba(255,255,255,0.96))]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={17} />
            </span>
            <div>
              <p className="dashboard-text-faint text-[10px] font-black uppercase tracking-[0.18em]">Completed</p>
              <p className="dashboard-text-strong text-xl font-black">{completedItems}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-panel overflow-hidden rounded-[28px] border p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)]/80">
                <th className="dashboard-text-faint px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em]">Date</th>
                <th className="dashboard-text-faint px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em]">Type</th>
                <th className="dashboard-text-faint px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em]">Activity Details</th>
                <th className="dashboard-text-faint px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dashboard-frame-border)]">
              {history.length > 0 ? (
                history.map((item) => {
                  const formattedDateTime = formatHistoryDateTime(item.createdAt || item.updatedAt);
                  const budgetMeta = item.meta || null;

                  return (
                    <tr key={item._id} className="transition-all duration-200 hover:bg-[var(--dashboard-panel-soft)]/85">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="dashboard-text-strong text-sm font-semibold">{formattedDateTime.date}</span>
                          <span className="dashboard-text-muted mt-1 text-xs font-medium">{formattedDateTime.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="dashboard-chip inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em]">
                          {item.type?.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="dashboard-text-strong text-sm font-semibold">{item.title}</div>

                        {budgetMeta?.accountId ? (
                          <div className="mt-2 space-y-2">
                            {item.description ? (
                              <div className="dashboard-text-muted max-w-md text-xs">{item.description}</div>
                            ) : null}
                            <div className="dashboard-text-muted text-xs">
                              Account ID: <span className="dashboard-text-strong font-semibold">{budgetMeta.accountId}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center rounded-full border border-slate-300/50 bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-700">
                                Old: ${formatAmount(budgetMeta.oldLimit)}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-sky-300/50 bg-sky-100/70 px-3 py-1 text-xs font-semibold text-sky-700">
                                New: ${formatAmount(budgetMeta.newLimit)}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-emerald-300/50 bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Change: ${formatAmount(budgetMeta.changeAmount)}
                              </span>
                            </div>
                          </div>
                        ) : item.description ? (
                          <div className="dashboard-text-muted mt-0.5 line-clamp-2 max-w-xs text-xs">
                            {item.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(item.status)}`}>
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"></span>
                          {item.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="dashboard-accent-surface mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-white">
                        <ClipboardList size={26} />
                      </div>
                      <p className="dashboard-text-strong font-semibold">No history records found</p>
                      <p className="dashboard-text-muted mt-1 text-sm">New updates will appear here automatically.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="dashboard-subpanel flex items-start gap-3 rounded-[24px] border p-4 sm:p-5">
          <span className="dashboard-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl text-white">
            <Sparkles size={17} />
          </span>
          <div>
            <p className="dashboard-text-strong text-sm font-black tracking-tight">History updates are live</p>
            <p className="dashboard-text-muted mt-1 text-xs leading-5">Latest status changes are shown here as soon as they are processed.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HistoryPage;
