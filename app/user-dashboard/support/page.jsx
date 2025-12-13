"use client";
import { useEffect, useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";

export default function MyTicketsPage() {
  const { token } = useFirebaseAuth();
  const [tickets, setTickets] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!token) return;

    fetch("/api/support/ticket/my", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setTickets(data.data || []));
  }, [token]);

  return (
    <div className="p-6 max-w-4xl mx-auto text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Support Tickets</h1>
        <button
          onClick={() => router.push("/user-dashboard/support/create")}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + New Ticket
        </button>
      </div>

      {tickets.length === 0 && (
        <p className="text-gray-500">No tickets found</p>
      )}

      <div className="space-y-3">
        {tickets.map(t => (
          <div
            key={t._id}
            onClick={() => router.push(`/user-dashboard/support/${t._id}`)}
            className="border p-4 rounded cursor-pointer hover:bg-gray-50"
          >
            <div className="font-semibold">{t.subject}</div>
            <div className="text-sm text-gray-500 flex justify-between">
              <span>Status: {t.status}</span>
              <span>{new Date(t.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
