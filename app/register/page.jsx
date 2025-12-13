"use client";

import { useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Register() {
  const { signup, googleLogin } = useFirebaseAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  // 🔐 Firebase user → MongoDB sync
  const saveUserToBackend = async (firebaseUser, customName = "") => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: customName || firebaseUser.displayName || "User",
          photo: firebaseUser.photoURL,
        }),
      });

      if (!res.ok) throw new Error("Failed to save user");

      router.replace("/");
    } catch (err) {
      console.error(err);
      setError("Account created but failed to sync with database.");
    }
  };

  // 📧 Email + Password Signup
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
      if (user) {
        await saveUserToBackend(user, name);
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  // 🔵 Google Signup
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await googleLogin();
      if (user) {
        await saveUserToBackend(user);
      }
    } catch (err) {
      console.error(err);
      setError("Google login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Left Side */}
        <div className="hidden w-1/2 flex-col items-center justify-center bg-blue-50 p-10 md:flex">
          <iframe
            src="https://lottie.host/embed/9f7b6072-5b96-4876-8b43-261545638c40/3e5sKj6i9W.json"
            className="w-full h-[400px] border-none"
          />
          <h2 className="mt-6 text-2xl font-bold text-gray-800">
            Welcome to Our Platform
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Create an account and manage everything easily.
          </p>
        </div>

        {/* Right Side */}
        <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-14">
          <h2 className="mb-2 text-3xl font-bold text-gray-800">
            Create Account
          </h2>
          <p className="mb-8 text-gray-500">
            Please fill in the details below.
          </p>

          {error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <HiOutlineUser className="text-xl text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                required
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 focus:border-blue-500 focus:ring-blue-500 outline-none"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <HiOutlineMail className="text-xl text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                required
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 focus:border-blue-500 focus:ring-blue-500 outline-none"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <HiOutlineLockClosed className="text-xl text-gray-400" />
              </div>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                required
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 pr-10 focus:border-blue-500 focus:ring-blue-500 outline-none"
                onChange={(e) => setPass(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? (
                  <AiOutlineEyeInvisible className="text-xl text-gray-400" />
                ) : (
                  <AiOutlineEye className="text-xl text-gray-400" />
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="px-4 text-sm text-gray-500">Or</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 text-sm hover:bg-gray-50"
          >
            <FcGoogle className="text-xl" />
            Sign up with Google
          </button>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
