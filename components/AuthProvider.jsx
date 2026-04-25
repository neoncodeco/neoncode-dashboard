"use client";

import { SessionProvider } from "next-auth/react";
import { AppAuthProvider } from "@/hooks/useAppAuth";

export default function AuthProvider({ children }) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <AppAuthProvider>{children}</AppAuthProvider>
    </SessionProvider>
  );
}
