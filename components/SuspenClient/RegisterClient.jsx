
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineTicket,
} from "react-icons/hi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function RegisterClient() {
  const { signup, googleLogin } = useFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* 🔗 Auto pickup referral code from URL */
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  /* 🔐 Save user to backend */
  const saveUserToBackend = async (firebaseUser, customName = "") => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: customName || firebaseUser.displayName || "User",
        photo: firebaseUser.photoURL,
        referralCode: referralCode || undefined,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || "Registration failed");
    }

    router.replace("/");
  };

  /* 📧 Email signup */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    try {
      const user = await signup(email, pass);
      await saveUserToBackend(user, name);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  /* 🔵 Google signup */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const user = await googleLogin();
      await saveUserToBackend(user);
    } catch (err) {
      setError("Google signup failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        <h2 className="mb-1 text-2xl font-bold text-gray-800">
          Create Account
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Referral code is optional
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <Input
            icon={<HiOutlineUser />}
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            icon={<HiOutlineMail />}
            type="email"
            placeholder="Email Address"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password */}
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <HiOutlineLockClosed />
            </div>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              required
              onChange={(e) => setPass(e.target.value)}
              className="w-full rounded-lg border p-3 pl-10 pr-10 outline-none focus:border-blue-500"
            />
            <div
              className="absolute right-3 top-3 cursor-pointer"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </div>
          </div>

          {/* Referral Code */}
          <Input
            icon={<HiOutlineTicket />}
            placeholder="Referral Code (Optional)"
            value={referralCode}
            onChange={(e) =>
              setReferralCode(e.target.value.toUpperCase())
            }
          />

          <button
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="px-4 text-sm text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border py-3 hover:bg-gray-50"
        >
          <FcGoogle className="text-xl" />
          Sign up with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

/* 🔹 Reusable Input */
function Input({ icon, ...props }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-3 text-gray-400">
        {icon}
      </div>
      <input
        {...props}
        className="w-full rounded-lg border p-3 pl-10 outline-none focus:border-blue-500"
      />
    </div>
  );
}
