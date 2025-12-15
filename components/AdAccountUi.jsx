"use client";

import React, { useEffect, useState } from "react";
import { Search, RefreshCw, MoreHorizontal } from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

const AdAccountUi = () => {
  const { token } = useFirebaseAuth();

  const [adAccounts, setAdAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch from API
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const res = await fetch("/api/ads-request/list", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (json.ok) {
          setAdAccounts(json.data);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Loading screen
  if (loading) {
    return <p className="text-center py-10">Loading...</p>;
  }

  return (
    <div>
      {/* --- ৪. Ad Accounts টেবিল --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Table Header & Actions */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Your Ad Accounts</h2>

          <div className="flex gap-3 w-full md:w-auto">

            {/* Search Bar */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search accounts..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              <RefreshCw size={16} /> Status
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Meta Account ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Budget</th>
                <th className="px-6 py-4">Last Refreshed</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {adAccounts.map((account, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">

                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {account.accountName || "N/A"}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span className="text-blue-600 hover:underline cursor-pointer font-mono">
                      {account.MetaAccountID || "Not Assigned"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        account.status === "active"
                          ? "bg-green-100 text-green-700"
                          : account.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {account.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {account.monthlyBudget
                      ? `$${account.monthlyBudget}`
                      : "$0.00"}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(account.createdAt).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-right flex justify-end items-center gap-3">
                    <button className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700 transition font-medium shadow-sm">
                      Top Up
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>

                </tr>
              ))}

              {adAccounts.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">
                    No Ad Accounts Found
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex justify-end items-center gap-4 text-sm text-gray-500">
          <span>Rows per page: 10</span>
          <span>Page 1 of 1</span>
          <div className="flex gap-1">
            <button className="p-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled>
              &lt;
            </button>
            <button className="p-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled>
              &gt;
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdAccountUi;
