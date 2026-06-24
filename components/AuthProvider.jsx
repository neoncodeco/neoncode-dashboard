"use client";

import { SessionProvider } from "next-auth/react";
import { AppAuthProvider } from "@/hooks/useAppAuth";
import QueryProvider from "@/components/QueryProvider";

export default function AuthProvider({ children }) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <AppAuthProvider>
        <QueryProvider>{children}</QueryProvider>
      </AppAuthProvider>
    </SessionProvider>
  );
}
