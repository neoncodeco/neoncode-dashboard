"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Loader from "@/components/Loader";

export default function Home() {
  const router = useRouter();
  const { user, role, authReady, loadingRole } = useFirebaseAuth();

  useEffect(() => {
    // 1️⃣ Firebase resolve না হওয়া পর্যন্ত wait
    if (!authReady) return;

    // 2️⃣ User নাই → সরাসরি login
    if (!user) {
      router.replace("/login");
      return;
    }

    // 3️⃣ User আছে কিন্তু role এখনো load হয়নি
    if (loadingRole || !role) return;

    if (role !== "admin" && role !== "manager") {
      router.replace("/unauthorized");
    }
    // 4️⃣ Role-based redirect
    if (role === "admin" || role === "manager") {
      router.replace("/admin-dashboard/overview");
    } else {
      router.replace("/user-dashboard/overview");
    }
  }, [authReady, user, role, loadingRole, router]);

  return <Loader />;
}
