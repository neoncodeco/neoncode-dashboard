"use client";

import { useState } from "react";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login, googleLogin } = useFirebaseAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const syncUserWithBackend = async (firebaseUser) => {
    try {
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || "User",
          photo: firebaseUser.photoURL,
        }),
      });
    } catch (err) {
      console.warn("Backend sync warning:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email, pass);
      if (user) {
        await syncUserWithBackend(user);
        router.replace("/");
      }
    } catch (err) {
      setError("Invalid email or password!");
    } finally {
      setLoading(false);
    }
  };

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
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F4F6] p-4 font-sans">
      <div className="flex w-full max-w-[1000px] min-h-[600px] overflow-hidden rounded-[2.5rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white">
        
        {/* --- LEFT SIDE: Brand & Animation --- */}
        <div className="hidden w-1/2 flex-col items-center justify-center bg-[#111827] p-12 lg:flex relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#D8FF30] opacity-10 blur-[100px] rounded-full"></div>
          
          <div className="relative z-10 w-full flex flex-col items-center">
            <div className="text-center mt-8">
              <h2 className="text-3xl font-black text-white tracking-tight">
                NEON <span className="text-[#D8FF30]">STUDIO</span>
              </h2>
              <p className="mt-3 text-gray-400 font-medium max-w-[280px] mx-auto leading-relaxed">
                Empowering your digital growth with precision and speed.
              </p>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: Login Form --- */}
        <div className="flex w-full flex-col justify-center p-8 md:p-16 lg:w-1/2 bg-white">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Login</h2>
            <p className="mt-2 text-gray-500 font-medium">Welcome back! Access your account.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-3 animate-shake">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-black transition-colors">
                  <HiOutlineMail size={20} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="block w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 pl-12 text-sm font-bold text-gray-900 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">
                  Password
                </label>
                <Link href="/forgot-password" size={18} className="text-[11px] font-black text-gray-400 hover:text-black uppercase tracking-widest transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-black transition-colors">
                  <HiOutlineLockClosed size={20} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 pl-12 pr-12 text-sm font-bold text-gray-900 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all"
                  onChange={(e) => setPass(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-black transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-black px-5 py-4 text-sm font-black text-white transition-all hover:bg-gray-800 active:scale-95 disabled:bg-gray-200 disabled:cursor-not-allowed shadow-xl shadow-black/10"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : "SIGN IN TO DASHBOARD"}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-gray-100" />
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Social Login</span>
            <div className="h-[1px] flex-1 bg-gray-100" />
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-gray-50 bg-white px-5 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-100 transition-all active:scale-95 shadow-sm"
          >
            <FcGoogle size={22} />
            Continue with Google
          </button>

          {/* Sign Up Link */}
          <p className="mt-10 text-center text-sm font-medium text-gray-500">
            New to Neon Studio?{" "}
            <Link href="/register" className="font-black text-black hover:underline underline-offset-4">
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}