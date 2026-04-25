"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

const AppAuthContext = createContext(null);
const normalizeTextValue = (value) => (typeof value === "string" ? value : "");

function useProvideAppAuth() {
  const { data: session, status, update } = useSession();

  const [token, setToken] = useState("");
  /** Role from DB only; merged with JWT below for instant routing */
  const [roleFromApi, setRoleFromApi] = useState(null);
  const [userData, setUserData] = useState(null);
  const userRequestRef = useRef(null);
  const latestUidRef = useRef(null);

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

  latestUidRef.current = user?.uid ?? null;

  const jwtRole = useMemo(() => {
    const r = session?.user?.role;
    if (r == null || r === "") return null;
    return typeof r === "string" ? r : String(r);
  }, [session?.user?.role]);

  const role = useMemo(() => roleFromApi ?? jwtRole ?? null, [roleFromApi, jwtRole]);

  const loadingRole = useMemo(
    () => status === "loading" || (!!user && role == null),
    [status, user, role]
  );

  const refreshUser = useCallback(async () => {
    if (!user?.uid) {
      userRequestRef.current = null;
      setUserData(null);
      setRoleFromApi(null);
      return null;
    }

    if (userRequestRef.current) {
      return userRequestRef.current;
    }

    const requestUid = user.uid;

    const request = (async () => {
      try {
        const res = await fetch(`/api/users/${requestUid}`, { cache: "no-store" });

        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await res.json();
        if (latestUidRef.current !== requestUid) {
          return;
        }

        setUserData(data.data);
        setRoleFromApi(data?.data?.role || session?.user?.role || "user");
        setToken("session-auth");
      } catch (e) {
        console.error("AUTH ERROR:", e);
        if (latestUidRef.current !== requestUid) {
          return;
        }
        setUserData(null);
        setToken("");
        setRoleFromApi(null);
      } finally {
        userRequestRef.current = null;
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
      setRoleFromApi(null);
      setUserData(null);
      return;
    }

    refreshUser();
  }, [authReady, refreshUser, user?.uid]);

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

  const login = async (email, pass, turnstileToken, deviceFingerprint) => {
    const res = await signIn("credentials", {
      redirect: false,
      email: normalizeTextValue(email).trim(),
      password: normalizeTextValue(pass),
      turnstileToken: normalizeTextValue(turnstileToken),
      deviceFingerprint: normalizeTextValue(deviceFingerprint),
    });

    if (res?.error) {
      throw new Error("Invalid email or password");
    }

    await update();
    return true;
  };

  const signup = async (email, pass, name, referralCode, turnstileToken, deviceFingerprint) => {
    const regRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizeTextValue(email).trim(),
        password: normalizeTextValue(pass),
        name: normalizeTextValue(name).trim(),
        referralCode: normalizeTextValue(referralCode).trim(),
        turnstileToken: normalizeTextValue(turnstileToken),
        deviceFingerprint: normalizeTextValue(deviceFingerprint),
      }),
    });

    const regJson = await regRes.json();

    if (!regRes.ok) {
      throw new Error(regJson.error || "Registration failed");
    }

    return regJson;
  };

  const logout = async (callbackUrl = "/login") => {
    userRequestRef.current = null;
    setToken("");
    setRoleFromApi(null);
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

export function AppAuthProvider({ children }) {
  const value = useProvideAppAuth();

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);

  if (!context) {
    throw new Error("useAppAuth must be used within AppAuthProvider");
  }

  return context;
}

export default useAppAuth;
