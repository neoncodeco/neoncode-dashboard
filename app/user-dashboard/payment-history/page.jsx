"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  ChevronDown, // <--- Correctly imported now
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

const ROWS_PER_PAGE = 10;
// এখানে 'All' সহ সমস্ত সম্ভাব্য স্ট্যাটাস অন্তর্ভুক্ত করা হয়েছে।
const STATUS_OPTIONS = ["All", "approved", "Pending", "Failed"]; 

const PaymentHistoryUI = () => {
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
      <p className="text-center py-10 text-lg font-medium text-gray-700">
        Loading Payment History...
      </p>
    );

  return (
    <div className="p-6">
      <div className="bg-white text-black rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header & Actions */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Payment History
          </h2>

          <div className="flex gap-3 w-full md:w-auto">
            {/* Status Filter Dropdown */}
            <div className="relative">
              <label htmlFor="status-filter" className="sr-only">
                Filter by Status
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full md:w-40 appearance-none pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                fetchData();
                setFilterStatus("All");
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              <RefreshCw size={16} /> Refresh
            </button>

            {/* Export CSV Button */}
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-md"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase font-bold tracking-wider">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {currentPageData.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-medium text-gray-700">{p.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.date).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{p.description}</td>
                  <td className="px-6 py-4 text-sm font-extrabold text-green-600">${p.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.method}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        p.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : p.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : p.status === "Failed"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}

              {currentPageData.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500 text-lg">
                    No {filterStatus !== "All" ? filterStatus : ""} Payments Found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPayments.length > ROWS_PER_PAGE && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-600">
            <p>
              Showing {Math.min((page - 1) * ROWS_PER_PAGE + 1, filteredPayments.length)} to{" "}
              {Math.min(page * ROWS_PER_PAGE, filteredPayments.length)} of {filteredPayments.length} results
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={goToPrevPage}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="p-2 px-4 bg-blue-600 text-white rounded-lg font-medium">
                {page}
              </span>
              <button
                onClick={goToNextPage}
                disabled={page === totalPages || totalPages === 0}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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

export default PaymentHistoryUI;