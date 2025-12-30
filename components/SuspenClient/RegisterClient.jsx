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
import { Loader2 } from "lucide-react";

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

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

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
    if (!res.ok) throw new Error(json.error || "Registration failed");
    router.replace("/");
  };

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F4F6] p-4 font-sans">
      <div className="flex w-full max-w-[1100px] min-h-[650px] overflow-hidden rounded-[2.5rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white">
        
        {/* --- LEFT SIDE: Branding & Visual --- */}
        <div className="hidden w-1/2 flex-col items-center justify-center bg-[#111827] p-12 lg:flex relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#D8FF30] opacity-10 blur-[100px] rounded-full"></div>
          
          <div className="relative z-10 w-full flex flex-col items-center">

            <div className="text-center">
              <h2 className="text-3xl font-black text-white tracking-tight">
                JOIN <span className="text-[#D8FF30]">NEON</span> STUDIO
              </h2>
              <p className="mt-3 text-gray-400 font-medium max-w-[300px] mx-auto leading-relaxed">
                Create an account today and start managing your meta spending with ease.
              </p>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: Registration Form --- */}
        <div className="flex w-full flex-col justify-center p-8 md:p-12 lg:w-1/2 bg-white overflow-y-auto">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h2>
            <p className="mt-2 text-gray-500 font-medium">Step into the future of ad management.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-3 animate-shake">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <Input
                        icon={<HiOutlineUser size={20} />}
                        placeholder="John Doe"
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <Input
                        icon={<HiOutlineMail size={20} />}
                        type="email"
                        placeholder="john@example.com"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-black transition-colors">
                  <HiOutlineLockClosed size={20} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  onChange={(e) => setPass(e.target.value)}
                  className="block w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 pl-12 pr-12 text-sm font-bold text-gray-900 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all"
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

            {/* Referral Code */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between">
                Referral Code <span className="text-[9px] lowercase italic text-gray-300">(Optional)</span>
              </label>
              <Input
                icon={<HiOutlineTicket size={20} />}
                placeholder="EX: NEON100"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-black px-5 py-4 text-sm font-black text-white transition-all hover:bg-gray-800 active:scale-95 disabled:bg-gray-200 shadow-xl shadow-black/10 mt-2"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : "GET STARTED NOW"}
              </div>
            </button>
          </form>

          {/* Social Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-gray-100" />
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Quick Signup</span>
            <div className="h-[1px] flex-1 bg-gray-100" />
          </div>

          {/* Google Signup */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-gray-50 bg-white px-5 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-100 transition-all active:scale-95 shadow-sm"
          >
            <FcGoogle size={22} />
            Signup with Google
          </button>

          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-black text-black hover:underline underline-offset-4">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* 🔹 Improved Reusable Input */
function Input({ icon, ...props }) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-black transition-colors">
        {icon}
      </div>
      <input
        {...props}
        className="block w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 pl-12 text-sm font-bold text-gray-900 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all placeholder:text-gray-300"
      />
    </div>
  );
}