

"use client";
import { useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";

export default function CreateTicketPage() {
  const { token } = useFirebaseAuth();
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [screenshots, setScreenshots] = useState([]);

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch("/api/upload/screenshot", {
      method: "POST",
      body: fd,
    });

    return res.json();
  };

  const submit = async () => {
    const uploaded = [];
    for (const file of screenshots) {
      uploaded.push(await uploadImage(file));
    }

    const res = await fetch("/api/support/ticket/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subject,
        message,
        screenshots: uploaded,
      }),
    });

    const json = await res.json();
    router.push(`/user-dashboard/support/${json.ticketId}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto text-black">
      <h1 className="text-xl font-bold mb-4">Create Support Ticket</h1>

      <input
        placeholder="Subject"
        className="w-full border p-2 mb-3 rounded"
        onChange={e => setSubject(e.target.value)}
      />

      <textarea
        placeholder="Describe your problem"
        className="w-full border p-2 mb-3 rounded"
        rows={5}
        onChange={e => setMessage(e.target.value)}
      />

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={e => setScreenshots([...e.target.files])}
      />

      <button
        onClick={submit}
        className="mt-4 bg-black text-white px-4 py-2 rounded"
      >
        Submit Ticket
      </button>
    </div>
  );
}
