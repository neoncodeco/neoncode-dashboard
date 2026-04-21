"use client";

import React, { useEffect, useState, useMemo } from "react";
import { formatBdt, formatUsd } from "@/lib/currency";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  ChevronDown, 
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

const ROWS_PER_PAGE = 10;
// এখানে 'All' সহ সমস্ত সম্ভাব্য স্ট্যাটাস অন্তর্ভুক্ত করা হয়েছে।
const STATUS_OPTIONS = ["All", "approved", "pending", "failed", "cancelled", "rejected"];

const PaymentHistory = () => {
  const { token } = useFirebaseAuth();

  const [payments, setPayments] = useState([]); // Original fetched data
  const [filterStatus, setFilterStatus] = useState("All"); // State for status filter
  const [filteredPayments, setFilteredPayments] = useState([]); // Data after status filtering
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // Current page

  // 1. Fetch Payment History
  const fetchData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch("/api/payment/payhistory", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.ok) {
        setPayments(json.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // 2. Filter payments by Status (Updated for case-insensitive check)
  useEffect(() => {
    const lowerCaseFilter = filterStatus.toLowerCase();

    if (lowerCaseFilter === "all") {
      setFilteredPayments(payments);
    } else {
      // ডেটার status এবং ফিল্টারের status কে lower case করে তুলনা করা হচ্ছে
      const filtered = payments.filter(
        (p) => p.status.toLowerCase() === lowerCaseFilter
      );
      setFilteredPayments(filtered);
    }
    // Filter পরিবর্তন হলে পেজ ১ এ চলে যাবে
    setPage(1);
  }, [filterStatus, payments]);

  // 3. Pagination Logic
  const currentPageData = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filteredPayments.slice(start, start + ROWS_PER_PAGE);
  }, [filteredPayments, page]);

  const totalPages = Math.ceil(filteredPayments.length / ROWS_PER_PAGE);

  // Pagination Handlers
  const goToNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  // 4. Export CSV
  const exportCSV = () => {
    if (!filteredPayments.length) return;
    const csvContent = [
      ["Transaction ID", "Date", "Description", "Amount", "Method", "Status"],
      ...filteredPayments.map((p) => [
        p.id,
        new Date(p.date).toLocaleString(),
        p.description,
        p.amount,
        p.method,
        p.status,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payment_history.csv";
    link.click();
  };

  if (loading)
    return (
      <p className="dashboard-text-muted py-10 text-center text-lg font-medium">
        Loading Payment History...
      </p>
    );

  return (
    <div className="p-2">
      <div className="overflow-hidden rounded-[28px] border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-bg)] text-[var(--dashboard-text-strong)] shadow-[0_18px_42px_rgba(15,23,42,0.12)]">
        {/* Header & Actions */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-[var(--dashboard-frame-border)] p-6 md:flex-row">
          <h2 className="dashboard-text-strong flex items-center gap-2 text-2xl font-bold md:hidden lg:block">
            Payment History
          </h2>

          <div className="flex gap-3 w-full md:w-auto">
            {/* Status Filter Dropdown */}
            <div className="relative">
              <label htmlFor="status-filter" className="sr-only">
                Filter by Status
              </label>
              <div className="relative">
                <Filter
                  className="dashboard-text-faint absolute left-3 top-1/2 -translate-y-1/2"
                  size={18}
                />
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="dashboard-text-strong w-full cursor-pointer appearance-none rounded-lg border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] py-2 pl-10 pr-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[var(--dashboard-success-soft)] md:w-40"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="dashboard-text-faint pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  size={16}
                />
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                fetchData();
                setFilterStatus("All");
              }}
              className="btn-secondary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition"
            >
              <RefreshCw size={16} /> Refresh
            </button>

            {/* Export CSV Button */}
            <button
              onClick={exportCSV}
              className="btn-primary flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="dashboard-text-muted bg-[var(--dashboard-table-head)] text-sm font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--dashboard-frame-border)]">
              {currentPageData.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-[var(--dashboard-table-row-hover)]">
                  <td className="dashboard-text-strong px-6 py-4 text-sm font-mono font-medium">
                    {p.id}
                  </td>
                  <td className="dashboard-text-muted px-6 py-4 text-sm">
                    {new Date(p.date).toLocaleString()}
                  </td>
                  <td className="dashboard-text-strong px-6 py-4 text-sm">
                    {p.description}
                  </td>
                  <td className="px-6 py-4 text-sm font-extrabold text-[var(--dashboard-accent)]">
                    {(Number(p.creditedUsdAmount) || 0) > 0 ? (
                      <div className="text-sm font-extrabold text-[var(--dashboard-accent)]">{formatUsd(p.creditedUsdAmount)}</div>
                    ) : (
                      <div className="text-sm font-extrabold text-[var(--dashboard-accent)]">{formatBdt(p.amountBdt ?? p.amount)}</div>
                    )}
                    <div className="dashboard-text-muted text-xs font-semibold">{formatBdt(p.amountBdt ?? p.amount)} deposit</div>
                  </td>
                  <td className="dashboard-text-muted px-6 py-4 text-sm">
                    {p.method}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        p?.status?.toLowerCase() === "approved"
                          ? "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-accent-text)]"
                          : p?.status?.toLowerCase() === "pending"
                          ? "bg-[var(--dashboard-warn-soft)] dashboard-text-strong"
                          : p?.status?.toLowerCase() === "rejected"
                          ? "bg-[var(--dashboard-danger-soft)] dashboard-text-strong"
                          : p?.status?.toLowerCase() === "cancelled"
                          ? "bg-[var(--dashboard-danger-soft)] dashboard-text-strong"
                          : "bg-[var(--dashboard-panel-soft)] dashboard-text-muted"
                      }`}
                    >
                      {p?.status}
                    </span>
                  </td>
                </tr>
              ))}

              {currentPageData.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="dashboard-text-muted py-10 text-center text-lg"
                  >
                    No {filterStatus !== "All" ? filterStatus : ""} Payments
                    Found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPayments.length > ROWS_PER_PAGE && (
          <div className="dashboard-text-muted flex items-center justify-between border-t border-[var(--dashboard-frame-border)] p-4 text-sm">
            <p>
              Showing{" "}
              {Math.min(
                (page - 1) * ROWS_PER_PAGE + 1,
                filteredPayments.length
              )}{" "}
              to {Math.min(page * ROWS_PER_PAGE, filteredPayments.length)} of{" "}
              {filteredPayments.length} results
            </p>

            <div className="flex space-x-2">
              <button
                onClick={goToPrevPage}
                disabled={page === 1}
                className="btn-secondary rounded-lg border p-2 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="btn-primary rounded-lg border p-2 px-4 font-medium">
                {page}
              </span>
              <button
                onClick={goToNextPage}
                disabled={page === totalPages || totalPages === 0}
                className="btn-secondary rounded-lg border p-2 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
