"use client";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import React, { useEffect, useState } from "react";

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
        console.log("History data:", data);
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
        return "bg-green-100 text-green-700";
      case "pending":
      case "open":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-white">Loading History...</div>
    );

  return (
    <div className="p-4 md:p-10 bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Activity History</h1>

      <div className="overflow-x-auto bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 uppercase text-sm">
              <th className="p-4">Date</th>
              <th className="p-4">Type</th>
              <th className="p-4">Title/Subject</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {history.length > 0 ? (
              history.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-slate-700 hover:bg-slate-750 transition-colors"
                >
                  <td className="p-4 text-sm">
                    {new Date(
                      item.createdAt || item.updatedAt
                    ).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-700 rounded text-slate-300">
                      {item.type?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-slate-500 truncate w-48">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status?.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-10 text-center text-slate-500">
                  No history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPage;
