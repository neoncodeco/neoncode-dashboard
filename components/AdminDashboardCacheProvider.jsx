"use client";

import React, { createContext, useContext, useMemo, useRef } from "react";

const AdminDashboardCacheContext = createContext(null);

export function AdminDashboardCacheProvider({ children }) {
  const cacheRef = useRef(new Map());

  const value = useMemo(
    () => ({
      getCache: (key) => cacheRef.current.get(key),
      setCache: (key, value) => {
        cacheRef.current.set(key, value);
        return value;
      },
      clearCache: (key) => {
        if (typeof key === "string") {
          cacheRef.current.delete(key);
          return;
        }
        cacheRef.current.clear();
      },
    }),
    []
  );

  return (
    <AdminDashboardCacheContext.Provider value={value}>
      {children}
    </AdminDashboardCacheContext.Provider>
  );
}

export function useAdminDashboardCache() {
  const context = useContext(AdminDashboardCacheContext);

  if (!context) {
    throw new Error("useAdminDashboardCache must be used within AdminDashboardCacheProvider");
  }

  return context;
}
