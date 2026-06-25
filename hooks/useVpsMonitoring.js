"use client";

import { useEffect } from "react";
import { useApiQuery, useInvalidateApi } from "@/hooks/useApiQuery";
import { queryKeys } from "@/lib/queryKeys";

export function useVpsLive(serverId) {
  const invalidate = useInvalidateApi();
  const path = serverId ? `/api/vps/live?serverId=${encodeURIComponent(serverId)}` : "/api/vps/live";

  const query = useApiQuery(queryKeys.admin.vpsLive(serverId), path, {
    staleTime: 3_000,
    refetchInterval: 5_000,
    select: (json) => (Array.isArray(json.data) ? json.data : []),
  });

  useEffect(() => {
    let source;

    try {
      source = new EventSource("/api/vps/stream");
      source.addEventListener("metrics", () => {
        invalidate(queryKeys.admin.vpsLive(serverId));
        if (serverId) invalidate(queryKeys.admin.vpsHistory(serverId, "24h"));
      });
    } catch {
      // SSE optional — polling still works
    }

    return () => {
      source?.close();
    };
  }, [serverId, invalidate]);

  return query;
}

export function useVpsHistory(serverId, range) {
  return useApiQuery(
    queryKeys.admin.vpsHistory(serverId, range),
    `/api/vps/history?serverId=${encodeURIComponent(serverId)}&range=${encodeURIComponent(range)}`,
    {
      enabled: Boolean(serverId),
      staleTime: 10_000,
      select: (json) => json.data || { points: [] },
    }
  );
}

export function useVpsAlerts(serverId) {
  const path = serverId
    ? `/api/vps/alerts?serverId=${encodeURIComponent(serverId)}`
    : "/api/vps/alerts";

  return useApiQuery(queryKeys.admin.vpsAlerts(serverId), path, {
    staleTime: 5_000,
    refetchInterval: 10_000,
    select: (json) => (Array.isArray(json.data) ? json.data : []),
  });
}

export function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

export function formatSpeed(bytesPerSec) {
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatUptime(seconds) {
  const total = Number(seconds || 0);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
