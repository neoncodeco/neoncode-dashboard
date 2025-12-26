
"use client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast"; 

export default function TokenSettings() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

 
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setToken(data.token);
      });
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newToken: token }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      toast.success("Token updated successfully!");
    } else {
      toast.error(data.error || "Failed to update");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">System Configuration</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Facebook System Token</label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows="4"
            placeholder="Enter FB_SYS_TOKEN here..."
          />
        </div>
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? "Updating..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
