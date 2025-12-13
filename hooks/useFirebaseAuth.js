"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function useFirebaseAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRole, setLoadingRole] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setLoadingRole(true);

      if (!firebaseUser) {
        setUser(null);
        setToken("");
        setRole(null);
        setUserData(null);
        setLoading(false);
        setLoadingRole(false);
        setAuthReady(true);
        return;
      }

      try {
        const tk = await firebaseUser.getIdToken();
        setUser(firebaseUser);
        setToken(tk);

        const res = await fetch(`/api/users/${firebaseUser.uid}`, {
          headers: {
            Authorization: `Bearer ${tk}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await res.json();
        setUserData(data);
        setRole(data.role || "user");
      } catch (e) {
        console.error("AUTH ERROR:", e);
        setRole(null);
        setUserData(null);
      } finally {
        setLoading(false);
        setLoadingRole(false);
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  const googleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, pass) => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, pass) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken("");
    setRole(null);
    setUserData(null);
    setAuthReady(true);
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
    isLoggedIn: !!user,
  };
}
