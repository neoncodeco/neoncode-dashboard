"use client";

import { useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Login() {
  const { login, googleLogin } = useFirebaseAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // 🔐 Ensure user exists in MongoDB (important for ticket system)
  const syncUserWithBackend = async (firebaseUser) => {
    try {
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || "User",
          photo: firebaseUser.photoURL ,
        }),
      });
    } catch (err) {
      console.warn("Backend sync warning:", err);
      // Firebase login success হলে login block করবো না
    }
  };

  // 📧 Email + Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(email, pass);
      if (user) {
        await syncUserWithBackend(user); // 🔥 ensure DB user
        router.replace("/");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid email or password!");
    } finally {
      setLoading(false);
    }
  };

  // 🔵 Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const user = await googleLogin();
      if (user) {
        await syncUserWithBackend(user);
        router.replace("/");
      }
    } catch (err) {
      console.error(err);
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Left Side */}
        <div className="hidden w-1/2 flex-col items-center justify-center bg-indigo-50 p-10 md:flex">
          <iframe
            src="https://lottie.host/embed/b8751509-f308-418c-9c3c-836a943725e2/5s2x6n9o3L.json"
            className="w-full h-[400px] border-none"
            title="Login Animation"
          />
          <h2 className="mt-6 text-2xl font-bold text-gray-800">
            Welcome Back!
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Login to access your dashboard.
          </p>
        </div>

        {/* Right Side */}
        <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-14">
          <h2 className="mb-2 text-3xl font-bold text-gray-800">Login</h2>
          <p className="mb-8 text-gray-500">
            Welcome back! Please enter your details.
          </p>

          {error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <HiOutlineMail className="text-xl text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 focus:border-indigo-500 focus:ring-indigo-500 outline-none"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <HiOutlineLockClosed className="text-xl text-gray-400" />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 pr-10 focus:border-indigo-500 focus:ring-indigo-500 outline-none"
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

              <div className="mt-2 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="px-4 text-sm text-gray-500">
              Or login with
            </span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium hover:bg-gray-50"
          >
            <FcGoogle className="text-xl" />
            Log in with Google
          </button>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
