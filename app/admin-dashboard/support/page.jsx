"use client";
import { useEffect, useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";

export default function AdminTickets() {
  const { token } = useFirebaseAuth();
  const [tickets, setTickets] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!token) return;

    fetch("/api/admin/support/ticket/all", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setTickets(data.data || []));
  }, [token]);

  return (
    <div className="p-6 max-w-5xl text-black mx-auto">
      <h1 className="text-2xl font-bold mb-6">All Support Tickets</h1>

      <div className="space-y-3">
        {tickets.map(t => (
          <div
            key={t._id}
            onClick={() => router.push(`/admin-dashboard/support/${t._id}`)}
            className="border p-4 rounded cursor-pointer hover:bg-gray-50"
          >
            <div className="font-semibold">{t.subject}</div>
            <div className="text-sm text-gray-500 flex justify-between">
              <span>Status: {t.status}</span>
              <span>User: {t.userId}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
