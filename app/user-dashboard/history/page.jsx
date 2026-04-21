"use client";

import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ClipboardList, Clock3, Filter, History } from "lucide-react";

const CATEGORY_CONFIG = [
  { key: "all", label: "All" },
  { key: "budget", label: "Budget" },
  { key: "payment", label: "Payment" },
  { key: "support", label: "Support" },
  { key: "affiliate", label: "Affiliate" },
  { key: "project", label: "Project" },
  { key: "account", label: "Account" },
  { key: "other", label: "Other" },
];

const PENDING_STATUSES = new Set(["pending", "open"]);
const COMPLETED_STATUSES = new Set(["approved", "active", "success", "completed"]);

const normalizeText = (value) => (typeof value === "string" ? value.toLowerCase() : "");

const resolveCategory = (item) => {
  const type = normalizeText(item?.type);
  const title = normalizeText(item?.title);
  const fullText = `${type} ${title}`;

  if (fullText.includes("budget") || fullText.includes("limit")) return "budget";
  if (fullText.includes("payment") || fullText.includes("wallet") || fullText.includes("topup")) return "payment";
  if (fullText.includes("support") || fullText.includes("ticket") || fullText.includes("chat")) return "support";
  if (fullText.includes("affiliate") || fullText.includes("referral")) return "affiliate";
  if (fullText.includes("project") || fullText.includes("task")) return "project";
  if (fullText.includes("account") || fullText.includes("profile")) return "account";
  return "other";
};

const formatTypeLabel = (value) => {
  const normalized = (value || "activity").toString().replaceAll("_", " ").trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getStatusStyle = (status) => {
  const normalized = normalizeText(status);

  if (COMPLETED_STATUSES.has(normalized)) {
    return "border-emerald-300/50 bg-emerald-100/70 text-emerald-700";
  }
  if (PENDING_STATUSES.has(normalized)) {
    return "border-amber-300/50 bg-amber-100/70 text-amber-700";
  }
  if (normalized === "rejected" || normalized === "failed" || normalized === "canceled" || normalized === "cancelled" || normalized === "declined") {
    return "border-rose-300/50 bg-rose-100/70 text-rose-700";
  }

  return "border-slate-300/50 bg-slate-100/80 text-slate-700";
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

const HistoryRowDetails = ({ item }) => {
  const budgetMeta = item.meta || null;

  if (budgetMeta?.accountId) {
    return (
      <div className="mt-2 space-y-2">
        {item.description ? <div className="dashboard-text-muted max-w-md text-xs">{item.description}</div> : null}
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
    );
  }

  if (item.description) {
    return <div className="dashboard-text-muted mt-0.5 text-xs">{item.description}</div>;
  }

  return null;
};

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
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
        if (data.ok) setHistory(Array.isArray(data.data) ? data.data : []);
      } catch {
        console.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  const categoryCounts = useMemo(() => {
    const counts = {
      all: history.length,
      budget: 0,
      payment: 0,
      support: 0,
      affiliate: 0,
      project: 0,
      account: 0,
      other: 0,
    };

    history.forEach((item) => {
      const category = resolveCategory(item);
      counts[category] += 1;
    });

    return counts;
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (activeCategory === "all") return history;
    return history.filter((item) => resolveCategory(item) === activeCategory);
  }, [activeCategory, history]);

  const totalItems = filteredHistory.length;
  const pendingItems = filteredHistory.filter((item) => PENDING_STATUSES.has(normalizeText(item.status))).length;
  const completedItems = filteredHistory.filter((item) => COMPLETED_STATUSES.has(normalizeText(item.status))).length;

  if (loading) {
    return (
      <div className="user-dashboard-theme-scope flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-transparent">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[var(--dashboard-accent)]" />
        <p className="dashboard-text-muted text-sm font-semibold">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-theme-scope min-h-screen space-y-5 bg-transparent p-3 sm:p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="dashboard-subpanel mt-4 rounded-[28px] border border-white/10 p-3 sm:p-4"
      >
        <div className="max-w-3xl">
          <h1 className="dashboard-text-strong text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Activity History</h1>
          <p className="dashboard-text-muted mt-2 text-sm leading-6">Track your recent requests, updates, and status—now with category-wise filtering.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="dashboard-subpanel rounded-[24px] border p-3 sm:p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="dashboard-accent-surface flex h-8 w-8 items-center justify-center rounded-xl text-white">
            <Filter size={14} />
          </span>
          <p className="dashboard-text-strong text-sm font-bold">Browse by category</p>
        </div>

        <div className="-mx-1 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full items-center gap-2 md:w-full md:min-w-0 md:flex-wrap md:justify-start">
            {CATEGORY_CONFIG.map((category) => {
              const isActive = activeCategory === category.key;
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setActiveCategory(category.key)}
                  className={`shrink-0 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                    isActive
                      ? "dashboard-accent-surface border-transparent text-white"
                      : "dashboard-subpanel border-[var(--dashboard-frame-border)] dashboard-text-muted hover:dashboard-text-strong"
                  }`}
                >
                  {category.label} ({categoryCounts[category.key] || 0})
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.08, ease: "easeOut" }}
          className="dashboard-subpanel rounded-[18px] border p-3 shadow-[0_16px_38px_rgba(15,23,42,0.08)] !border-sky-300/45 !bg-[linear-gradient(135deg,rgba(115,200,255,0.28),rgba(115,200,255,0.12)_50%,rgba(255,255,255,0.96))] sm:rounded-[22px] sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="dashboard-accent-surface flex h-8 w-8 items-center justify-center rounded-xl text-white sm:h-10 sm:w-10 sm:rounded-2xl">
              <History size={17} />
            </span>
            <div>
              <p className="dashboard-text-faint text-[9px] font-black uppercase tracking-[0.12em] sm:text-[10px] sm:tracking-[0.18em]">Visible</p>
              <p className="dashboard-text-strong text-base font-black sm:text-xl">{totalItems}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.12, ease: "easeOut" }}
          className="dashboard-subpanel rounded-[18px] border p-3 shadow-[0_16px_38px_rgba(15,23,42,0.08)] !border-amber-300/50 !bg-[linear-gradient(135deg,rgba(251,191,36,0.24),rgba(251,191,36,0.1)_50%,rgba(255,255,255,0.96))] sm:rounded-[22px] sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 sm:h-10 sm:w-10 sm:rounded-2xl">
              <Clock3 size={17} />
            </span>
            <div>
              <p className="dashboard-text-faint text-[9px] font-black uppercase tracking-[0.12em] sm:text-[10px] sm:tracking-[0.18em]">Pending</p>
              <p className="dashboard-text-strong text-base font-black sm:text-xl">{pendingItems}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.16, ease: "easeOut" }}
          className="dashboard-subpanel rounded-[18px] border p-3 shadow-[0_16px_38px_rgba(15,23,42,0.08)] !border-emerald-300/50 !bg-[linear-gradient(135deg,rgba(183,223,105,0.34),rgba(183,223,105,0.12)_48%,rgba(255,255,255,0.96))] sm:rounded-[22px] sm:p-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 sm:h-10 sm:w-10 sm:rounded-2xl">
              <CheckCircle2 size={17} />
            </span>
            <div>
              <p className="dashboard-text-faint text-[9px] font-black uppercase tracking-[0.12em] sm:text-[10px] sm:tracking-[0.18em]">Completed</p>
              <p className="dashboard-text-strong text-base font-black sm:text-xl">{completedItems}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
        className="dashboard-panel overflow-hidden rounded-[24px] border p-0"
      >
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left">
            <thead>
              <tr className="border-b border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-soft)]/80">
                <th className="dashboard-text-faint px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em]">Date</th>
                <th className="dashboard-text-faint px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em]">Type</th>
                <th className="dashboard-text-faint px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em]">Activity Details</th>
                <th className="dashboard-text-faint px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dashboard-frame-border)]">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => {
                  const formattedDateTime = formatHistoryDateTime(item.createdAt || item.updatedAt);

                  return (
                    <tr key={item._id} className="bg-[var(--dashboard-panel-soft)]/85 transition-all duration-200">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-col">
                          <span className="dashboard-text-strong text-sm font-semibold">{formattedDateTime.date}</span>
                          <span className="dashboard-text-muted mt-1 text-xs font-medium">{formattedDateTime.time}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="dashboard-chip inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em]">
                          {formatTypeLabel(item.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="dashboard-text-strong text-sm font-semibold">{item.title}</div>
                        <HistoryRowDetails item={item} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(item.status)}`}>
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                          {item.status?.toUpperCase() || "--"}
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
                      <p className="dashboard-text-muted mt-1 text-sm">Try another category or check back later.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default HistoryPage;
