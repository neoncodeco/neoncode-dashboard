"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import useFirebaseAuth from "@/hooks/useFirebaseAuth"; // 🔑 token এখান থেকে আসছে

export default function TokenSettings() {
  const { token } = useFirebaseAuth(); // ✅ SAME AS SUPPORT REPLY
  const [fbToken, setFbToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  /* ---------------- LOAD SETTINGS ---------------- */
  useEffect(() => {
    if (!token) return;

    fetch("/api/admin/settings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw data;

        setFbToken(data.token || "");
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: "Unauthorized",
          text: err?.error || "You are not allowed to access settings",
        });
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [token]);

  /* ---------------- UPDATE TOKEN ---------------- */
  const handleUpdate = async () => {
    if (!fbToken.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Empty Token",
        text: "Please enter a valid Facebook System Token",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ SAME PATTERN
        },
        body: JSON.stringify({ newToken: fbToken }),
      });

      const data = await res.json();

      if (!res.ok) throw data;

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "System token updated successfully!",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err?.error || "Failed to update token",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  if (initialLoading) {
    return (
      <div className="p-6 bg-white rounded-lg border shadow text-gray-500">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-xl">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        System Configuration
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Facebook System Token
          </label>

          <textarea
            value={fbToken}
            onChange={(e) => setFbToken(e.target.value)}
            rows={4}
            placeholder="Enter FB_SYS_TOKEN here..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded
                     hover:bg-blue-700 disabled:bg-gray-400
                     transition flex items-center gap-2"
        >
          {loading ? "Updating..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
