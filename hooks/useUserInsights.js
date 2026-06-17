"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import useAppAuth from "@/hooks/useAppAuth";

export function useUserInsights(userId, options = {}) {
  const { autoLoad = true } = options;
  const { token } = useAppAuth();
  const [loading, setLoading] = useState(autoLoad);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState(null);

  const loadInsights = useCallback(
    async (loadOptions = {}) => {
      if (!token || !userId) return null;
      if (loadOptions.silent) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/insights`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load insights");
        setInsights(json);
        return json;
      } catch (err) {
        if (!loadOptions.silent) {
          await Swal.fire({
            title: "Could not load user data",
            text: err.message || "Please try again.",
            icon: "error",
            confirmButtonColor: "#2563eb",
          });
        }
        return null;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, userId]
  );

  useEffect(() => {
    if (autoLoad) void loadInsights();
  }, [autoLoad, loadInsights]);

  return { insights, loading, refreshing, loadInsights, setInsights };
}
