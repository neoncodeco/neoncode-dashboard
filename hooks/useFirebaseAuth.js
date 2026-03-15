"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

const FirebaseAuthContext = createContext(null);
const normalizeTextValue = (value) => (typeof value === "string" ? value : "");

function useProvideFirebaseAuth() {
  const { data: session, status, update } = useSession();

  const [token, setToken] = useState("");
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const userRequestRef = useRef(null);

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
      userRequestRef.current = null;
      setUserData(null);
      setLoadingRole(false);
      return null;
    }

    if (userRequestRef.current) {
      return userRequestRef.current;
    }

    setLoadingRole(true);

    const request = (async () => {
      try {
        const res = await fetch(`/api/users/${user.uid}`, { cache: "no-store" });

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
        userRequestRef.current = null;
        setLoadingRole(false);
      }
    })();

    userRequestRef.current = request;
    return request;
  }, [session?.user?.role, user?.uid]);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      userRequestRef.current = null;
      setToken("");
      setRole(null);
      setUserData(null);
      setLoadingRole(false);
      return;
    }

    refreshUser();
  }, [authReady, refreshUser, user]);

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
      email: normalizeTextValue(email).trim(),
      password: normalizeTextValue(pass),
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
      body: JSON.stringify({
        email: normalizeTextValue(email).trim(),
        password: normalizeTextValue(pass),
        name: normalizeTextValue(name).trim(),
        referralCode: normalizeTextValue(referralCode).trim(),
      }),
    });

    const regJson = await regRes.json();

    if (!regRes.ok) {
      throw new Error(regJson.error || "Registration failed");
    }

    const loginRes = await signIn("credentials", {
      redirect: false,
      email: normalizeTextValue(email).trim(),
      password: normalizeTextValue(pass),
    });

    if (loginRes?.error) {
      throw new Error("Sign-in after registration failed");
    }

    await update();
    return true;
  };

  const logout = async (callbackUrl = "/login") => {
    userRequestRef.current = null;
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

export function FirebaseAuthProvider({ children }) {
  const value = useProvideFirebaseAuth();

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export default function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);

  if (!context) {
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  }

  return context;
}
