"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function useFirebaseAuth() {
  const { data: session, status, update } = useSession();

  const [token, setToken] = useState("");
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const authReady = status !== "loading";
  const loading = status === "loading";

  const user = useMemo(() => {
    if (!session?.user) return null;

    return {
      uid: session.user.uid,
      email: session.user.email,
      displayName: session.user.name,
      photoURL: session.user.image,
    };
  }, [session?.user]);

  const refreshUser = useCallback(async () => {
    if (!user?.uid) {
      setUserData(null);
      setLoadingRole(false);
      return;
    }

    setLoadingRole(true);

    try {
      const res = await fetch(`/api/users/${user.uid}`);

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      setUserData(data.data);
      setRole(data?.data?.role || session?.user?.role || "user");
      setToken("session-auth");
    } catch (e) {
      console.error("AUTH ERROR:", e);
      setRole(null);
      setUserData(null);
      setToken("");
    } finally {
      setLoadingRole(false);
    }
  }, [user?.uid, session?.user?.role]);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setToken("");
      setRole(null);
      setUserData(null);
      setLoadingRole(false);
      return;
    }

    refreshUser();
  }, [authReady, user, refreshUser]);

  const googleLogin = async () => {
    const res = await signIn("google", {
      redirect: false,
      callbackUrl: "/",
    });

    if (res?.error) {
      throw new Error(res.error);
    }

    if (res?.url) {
      window.location.href = res.url;
    }

    return null;
  };

  const login = async (email, pass) => {
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password: pass,
    });

    if (res?.error) {
      throw new Error("Invalid email or password");
    }

    await update();
    return true;
  };

  const signup = async (email, pass, name, referralCode) => {
    const regRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass, name, referralCode }),
    });

    const regJson = await regRes.json();

    if (!regRes.ok) {
      throw new Error(regJson.error || "Registration failed");
    }

    const loginRes = await signIn("credentials", {
      redirect: false,
      email,
      password: pass,
    });

    if (loginRes?.error) {
      throw new Error("Sign-in after registration failed");
    }

    await update();
    return true;
  };

  const logout = async (callbackUrl = "/login") => {
    setToken("");
    setRole(null);
    setUserData(null);
    try {
      await signOut({ redirect: true, callbackUrl });
    } catch (e) {
      console.error("SignOut failed:", e);
      if (typeof window !== "undefined") {
        window.location.href = callbackUrl;
      }
    }
  };

  return {
    user,
    userData,
    authReady,
    token,
    role,
    loading,
    loadingRole,
    login,
    signup,
    googleLogin,
    logout,
    refreshUser,
    isLoggedIn: !!user,
  };
}
