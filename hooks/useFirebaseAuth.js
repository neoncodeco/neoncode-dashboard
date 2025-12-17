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
        // 🔥 FORCE TOKEN REFRESH (important for first login / role update)
        const tk = await firebaseUser.getIdToken(true);
        setUser(firebaseUser);
        setToken(tk);

        // 🔐 READ ROLE FROM CUSTOM CLAIM
        const tokenResult = await firebaseUser.getIdTokenResult();
        setRole(tokenResult.claims?.role || "user");

        // 📦 FETCH USER DATA FROM DB (non-security data)
        const res = await fetch(`/api/users/${firebaseUser.uid}`, {
          headers: {
            Authorization: `Bearer ${tk}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await res.json();
        setUserData(data.data);
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

  /* ================= AUTH ACTIONS ================= */

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

  console.log("this is your role " ,  role );


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
