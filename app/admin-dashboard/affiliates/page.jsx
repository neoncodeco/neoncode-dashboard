"use client";

import { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  CreditCard, // Added for payment method icon
} from "lucide-react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth"; // Assume this hook is available

// --- STATUS COLOR HELPER ---
/**
 * বিভিন্ন স্ট্যাটাসের জন্য Tailwind CSS ক্লাস প্রদান করে।
 * @param {string} status - অনুরোধের স্ট্যাটাস (approved, pending, rejected)।
 * @returns {string} সংশ্লিষ্ট Tailwind CSS ক্লাস।
 */
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-green-50 text-green-700 ring-green-600/20";
    case "pending":
      return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
    case "rejected":
      return "bg-red-50 text-red-700 ring-red-600/20";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-500/10";
  }
};

// --- DATA MOCKUP (Replace with actual data structure) ---
/*
const mockRequests = [
  { _id: '1', userName: 'Alice Johnson', userEmail: 'alice@example.com', amount: 500, method: 'bank transfer', account: { number: '1234xxxx5678' }, status: 'approved', createdAt: new Date(Date.now() - 86400000) },
  { _id: '2', userName: 'Bob Smith', userEmail: 'bob@example.com', amount: 1200, method: 'paypal', account: { number: 'bob@paypal.com' }, status: 'pending', createdAt: new Date() },
  { _id: '3', userName: 'Charlie Brown', userEmail: 'charlie@example.com', amount: 350, method: 'bKash', account: { number: '017xxxxxx78' }, status: 'rejected', createdAt: new Date(Date.now() - 172800000) },
];
*/

export default function AffiliatePayoutsPage() {
  const { token } = useFirebaseAuth();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false); // Global loading for actions

  // --- LOAD REQUESTS ---
  const loadRequests = async () => {
    // setLoading(true); // Uncomment if you want loading state while fetching
    try {
      const res = await fetch("/api/admin/affiliate/list", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setRequests(json.data);
      } else {
        // Handle error fetching data
        console.error("Failed to load requests:", json.message);
        setRequests([]); // Clear previous data on failure
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
    // setLoading(false); // Uncomment if you want loading state while fetching
  };

  useEffect(() => {
    if (token) loadRequests();
  }, [token]);

  // --- ACTION HANDLER ---
  const handleAction = async (requestId, action) => {
    if (loading) return; // Prevent multiple clicks

    const actionText = action === "approve" ? "approve" : "reject";
    if (!confirm(`Are you sure you want to ${actionText} this request?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliate/approve", { // Assuming the same endpoint handles both
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, action }),
      });

      const json = await res.json();

      if (res.ok) {
        // Optimistic update or success message
        console.log(`Request ${requestId} ${actionText}d successfully.`);
        // Reload data to reflect changes
        loadRequests();
      } else {
        // Error handling
        console.error(`Failed to ${actionText} request:`, json.message);
        alert(`Failed to ${actionText} request: ${json.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error(`Error during ${actionText} action:`, error);
      alert(`An error occurred while trying to ${actionText} the request.`);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERED REQUESTS ---
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Ensure status is a string before calling toLowerCase
      const requestStatus = r.status?.toLowerCase() || '';

      const statusMatch =
        filter === "All" ||
        requestStatus === filter.toLowerCase();

      // Ensure names and emails are strings before calling toLowerCase and includes
      const userName = r.userName?.toLowerCase() || '';
      const userEmail = r.userEmail?.toLowerCase() || '';
      
      const searchLower = search.toLowerCase();

      const searchMatch =
        userName.includes(searchLower) ||
        userEmail.includes(searchLower);

      return statusMatch && searchMatch;
    });
  }, [requests, filter, search]);

  // --- STATS CALCULATION ---
  const totalPaid = useMemo(() => {
    return requests
      .filter((r) => r.status?.toLowerCase() === "approved")
      .reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [requests]);

  const pendingCount = useMemo(() => {
    return requests.filter(
      (r) => r.status?.toLowerCase() === "pending"
    ).length;
  }, [requests]);

  // --- UI RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-8">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Affiliate Payouts
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and process affiliate withdrawal requests in real-time.
          </p>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 transition duration-150 ease-in-out"
        >
          <Download size={16} /> Export Data (CSV)
        </button>
      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            label: "Total Paid Out",
            value: `$${totalPaid.toLocaleString('en-US')}`,
            sub: "Total approved payouts",
            icon: DollarSign,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Pending Requests",
            value: pendingCount.toLocaleString('en-US'),
            sub: "Awaiting administrator approval",
            icon: Users,
            color: "text-orange-600 bg-orange-50",
          },
          {
            label: "Total Requests",
            value: requests.length.toLocaleString('en-US'),
            sub: "All time withdrawal requests",
            icon: CreditCard,
            color: "text-blue-600 bg-blue-50",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                <h3 className="text-3xl font-extrabold text-gray-900">
                  {item.value}
                </h3>
                <p className={`text-xs font-semibold ${item.color.split(' ')[0]}`}>
                  {item.sub}
                </p>
              </div>
              <div className={`p-3 rounded-full ${item.color}`}>
                <item.icon size={24} className={item.color.split(' ')[0]} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= TRANSACTION TABLE ================= */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg">

        {/* SEARCH + FILTER AREA */}
        <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by affiliate name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter size={18} className="text-gray-500" />
            <select
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              onChange={(e) => setFilter(e.target.value)}
              defaultValue="All"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* TABLE WRAPPER */}
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead className="text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
              <tr>
                <th className="p-4 pl-6 font-semibold">Affiliate</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Account Info</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-right pr-6 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="text-sm divide-y divide-gray-100">
              {filteredRequests.map((req) => (
                <tr key={req._id} className="hover:bg-gray-50 transition duration-100">
                  <td className="p-4 pl-6">
                    <p className="font-semibold text-gray-800">{req.userName}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{req.userEmail}</p>
                  </td>

                  <td className="p-4 font-bold text-gray-900">${req.amount?.toLocaleString('en-US')}</td>
                  <td className="p-4 capitalize text-gray-600">{req.method}</td>
                  <td className="p-4 text-gray-600">{req.account?.number || 'N/A'}</td>
                  
                  <td className="p-4 text-gray-500">
                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }) : 'N/A'}
                  </td>

                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>

                  <td className="p-4 text-right pr-6">
                    {req.status?.toLowerCase() === "pending" ? (
                      <div className="flex justify-end gap-2">
                        {/* Approve Button */}
                        <button
                          title="Approve"
                          disabled={loading}
                          onClick={() => handleAction(req._id, "approve")}
                          className={`p-2 rounded-full transition duration-150 ${loading ? 'bg-gray-200 cursor-not-allowed' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                        >
                          <CheckCircle size={18} />
                        </button>
                        {/* Reject Button */}
                        <button
                          title="Reject"
                          disabled={loading}
                          onClick={() => handleAction(req._id, "reject")}
                          className={`p-2 rounded-full transition duration-150 ${loading ? 'bg-gray-200 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end items-center h-full">
                        <MoreHorizontal size={18} className="text-gray-400" title="No action available" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* EMPTY STATE */}
        {filteredRequests.length === 0 && (
          <div className="p-8 text-center bg-gray-50">
            <p className="text-base font-medium text-gray-600">
              No withdrawal requests found for the current filter/search.
            </p>
            <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search terms or filter settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}