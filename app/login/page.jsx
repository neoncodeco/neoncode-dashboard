"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { ArrowRight, Check, ChevronDown, Eye, EyeOff, Github, Globe, Loader2, LockKeyhole, Mail, MoveRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

const PARTICLES = [
  { size: 180, left: "6%", top: "16%", delay: 0, duration: 14 },
  { size: 120, left: "19%", top: "68%", delay: 1.4, duration: 18 },
  { size: 88, left: "40%", top: "32%", delay: 0.6, duration: 12 },
  { size: 64, left: "73%", top: "12%", delay: 2.1, duration: 16 },
  { size: 140, left: "82%", top: "72%", delay: 0.8, duration: 20 },
  { size: 54, left: "58%", top: "82%", delay: 1.1, duration: 15 },
];

const ORBIT_ITEMS = ["DESIGN", "DEVELOP", "MARKET", "GROW"];

const normalizeTextValue = (value) => (typeof value === "string" ? value : "");

export default function LoginPage() {
  const { login, googleLogin } = useFirebaseAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState("");
  const [error, setError] = useState("");
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0, x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedEmail = window.localStorage.getItem("neoncode_login_email");
    if (savedEmail && savedEmail !== "[object Object]") {
      setEmail(savedEmail);
      setRemember(true);
    } else if (savedEmail === "[object Object]") {
      window.localStorage.removeItem("neoncode_login_email");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const normalizedEmail = normalizeTextValue(email).trim();
      const normalizedPass = normalizeTextValue(pass);

      await login(normalizedEmail, normalizedPass);

      if (remember && typeof window !== "undefined") {
        window.localStorage.setItem("neoncode_login_email", normalizedEmail);
      } else if (typeof window !== "undefined") {
        window.localStorage.removeItem("neoncode_login_email");
      }

      router.replace("/");
    } catch {
      setError("Email or password matched hoyni. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setProviderLoading("google");
    setError("");

    try {
      await googleLogin();
    } catch {
      setError("Google sign-in complete korte parini. Please try again.");
      setProviderLoading("");
    }
  };

  const handleGithubLogin = async () => {
    setProviderLoading("github");
    setError("");

    try {
      const res = await signIn("github", {
        redirect: false,
        callbackUrl: "/",
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      if (res?.url) {
        window.location.href = res.url;
        return;
      }

      throw new Error("GitHub login unavailable");
    } catch {
      setError("GitHub sign-in ekhono configure kora nei. Google ba email diye login korun.");
      setProviderLoading("");
    }
  };

  const handleCardMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    setCardTilt({
      rotateX: (0.5 - py) * 9,
      rotateY: (px - 0.5) * 12,
      x: (px - 0.5) * 18,
      y: (py - 0.5) * 18,
    });
  };

  const resetTilt = () => {
    setCardTilt({ rotateX: 0, rotateY: 0, x: 0, y: 0 });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#000f08] text-white">
      <AnimatedBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:px-8">
        {/* <TopControls /> */}
        <motion.section
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative hidden min-h-[46vh] flex-1 overflow-hidden rounded-[2rem] border border-[#d8ff30]/8 bg-[linear-gradient(180deg,rgba(4,17,12,0.2),rgba(2,10,8,0.03))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.42)] sm:p-8 lg:flex lg:min-h-0 lg:rounded-[2.4rem] lg:p-10 xl:p-14"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(216,255,48,0.12),transparent_24%),radial-gradient(circle_at_78%_30%,rgba(0,255,213,0.12),transparent_22%),linear-gradient(120deg,rgba(255,255,255,0.02),transparent_35%)]" />

          <div className="relative z-10 flex w-full flex-col justify-between">
            <div>
              <Logo />

              <div className="mt-10 max-w-2xl lg:mt-16">
                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.7 }}
                  className="text-xl tracking-[0.18em] text-[#f5ffe6]/88"
                >
                  BUILD. INNOVATE. GROW. <span className="text-[#d8ff30]">TOGETHER.</span>
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scaleX: 0.7 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.22, duration: 0.7 }}
                  className="mt-8 h-1.5 w-28 origin-left rounded-full bg-[linear-gradient(90deg,#d8ff30,rgba(216,255,48,0.1))] shadow-[0_0_20px_rgba(216,255,48,0.5)]"
                />
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.26, duration: 0.6 }}
                  className="mt-1 flex gap-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff30]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff30]" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.8 }}
                  className="mt-20 max-w-[620px] text-4xl font-black leading-[1.22] tracking-tight text-[#f6ffe9] sm:text-5xl xl:text-[4.35rem]"
                >
                  We Create{" "}
                  <span className="text-[#d8ff30]">
                    Digital
                  </span>
                  <br />
                  Experiences That
                  <br />
                  <span className="text-[#d8ff30]">Inspire.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.75 }}
                  className="mt-7 max-w-xl text-xl leading-8 text-[#d6e5d6]/72"
                >
                  &nbsp;
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scaleX: 0.8 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.7 }}
                  className="mt-6 h-1.5 w-12 origin-left rounded-full bg-[#d8ff30] shadow-[0_0_18px_rgba(216,255,48,0.55)]"
                />
              </div>
            </div>

            <HeroVisual />

            <div className="mt-10 flex flex-wrap gap-8 lg:gap-12">
              {ORBIT_ITEMS.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + index * 0.08, duration: 0.55 }}
                  className="inline-flex items-center gap-4 text-base uppercase tracking-[0.18em] text-[#eaf7dc]/88"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8ff30]/30 bg-[rgba(216,255,48,0.04)] shadow-[0_0_20px_rgba(216,255,48,0.12)] text-[#d8ff30]">
                    <span className="h-4 w-4 rounded-[4px] border border-current" />
                  </span>
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, ease: "easeOut", delay: 0.08 }}
          className="relative flex min-h-screen w-full items-center justify-center lg:mt-0 lg:min-h-0 lg:w-[46%] lg:pl-6 xl:w-[42%]"
        >
          <motion.div
            onMouseMove={handleCardMove}
            onMouseLeave={resetTilt}
            animate={{
              rotateX: cardTilt.rotateX,
              rotateY: cardTilt.rotateY,
              x: cardTilt.x,
              y: cardTilt.y,
            }}
            transition={{ type: "spring", stiffness: 150, damping: 18, mass: 0.7 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-full max-w-[650px]"
          >
            <div className="absolute inset-y-10 -right-6 hidden w-full rounded-[34px] border border-[#00ffd5]/20 bg-[linear-gradient(180deg,rgba(6,14,22,0.4),rgba(6,14,22,0.18))] shadow-[0_0_40px_rgba(0,255,213,0.12)] lg:block" />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-[36px] border border-[#73839c]/45 bg-[linear-gradient(180deg,rgba(10,14,22,0.96),rgba(6,10,18,0.94))] p-5 shadow-[0_20px_90px_rgba(0,0,0,0.48),0_0_40px_rgba(0,255,213,0.08)] backdrop-blur-[24px] sm:p-7 lg:p-10"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,213,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(216,255,48,0.12),transparent_26%)]" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[35px] border border-white/5" />
              <motion.div
                className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rounded-full bg-[#00ffd5]/18 blur-3xl"
                animate={{ opacity: [0.4, 0.85, 0.45] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="pointer-events-none absolute bottom-0 left-10 h-20 w-40 rounded-full bg-[#d8ff30]/14 blur-3xl"
                animate={{ opacity: [0.25, 0.65, 0.25] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="mt-1 text-4xl font-black tracking-tight text-[#f8ffec] sm:text-[3.55rem]">Welcome Back!</h2>
                    <Link
                      href="/register"
                      className="mt-4 max-w-md text-[1.95rem] leading-[1.2] text-[#d3e5d9]/90 sm:text-[2rem] lg:text-[1.15rem] lg:leading-8">
                      Let&apos;s continue to <span className="border-b-2 border-[#d8ff30] text-[#d8ff30]">create</span> something amazing.
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[#d8ff30] shadow-[0_0_30px_rgba(216,255,48,0.1)]">
                    <Globe className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-12 flex items-center gap-10 border-b border-white/8 pb-4 text-xl">
                  <button type="button" className="relative font-bold text-white">
                    Login
                    <span className="absolute -bottom-4 left-0 h-1 w-32 rounded-full bg-[#d8ff30] shadow-[0_0_18px_rgba(216,255,48,0.65)]" />
                  </button>
                </div>

                {error ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 rounded-[20px] border border-[#ff6d6d]/18 bg-[#ff4d4d]/8 px-4 py-3 text-sm text-[#ffd5d5]"
                  >
                    {error}
                  </motion.div>
                ) : null}

                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                  <NeonInput
                    label="Email Address"
                    icon={Mail}
                    type="email"
                    value={normalizeTextValue(email)}
                    onChange={setEmail}
                    placeholder="name@neoncode.co"
                    autoComplete="email"
                  />

                  <NeonInput
                    label="Password"
                    icon={LockKeyhole}
                    type={showPass ? "text" : "password"}
                    value={normalizeTextValue(pass)}
                    onChange={setPass}
                    placeholder="Enter your secure password"
                    autoComplete="current-password"
                    rightAction={
                      <button
                        type="button"
                        onClick={() => setShowPass((current) => !current)}
                        className="rounded-full p-1 text-[#d6ead6]/66 transition hover:text-[#f3ffe4]"
                        aria-label={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    }
                  />

                  <div className="flex flex-col gap-3 text-sm text-[#d4e3d5] sm:flex-row sm:items-center sm:justify-between">
                    <label className="inline-flex cursor-pointer items-center gap-3 text-[1.05rem]">
                      <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#d8ff30]/35 bg-[#d8ff30]/8 shadow-[0_0_20px_rgba(216,255,48,0.08)]">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="peer absolute inset-0 cursor-pointer opacity-0"
                        />
                        <span className="absolute inset-0 rounded-full border border-transparent transition peer-focus:ring-4 peer-focus:ring-[#00ffd5]/10" />
                        <Check className="pointer-events-none absolute h-4 w-4 scale-0 text-[#d8ff30] transition peer-checked:scale-100" />
                      </span>
                      Remember Me
                    </label>

                    <Link
                      href="/forgot-password"
                      className="group inline-flex items-center gap-2 text-[1.05rem] text-[#d8ff30] transition hover:text-[#eeff9b]"
                    >
                      Forgot Password?
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01, boxShadow: "0 0 0 rgba(0,0,0,0)" }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={loading || providerLoading !== ""}
                    className="group relative flex min-h-[74px] w-full items-center justify-center overflow-hidden rounded-[20px] border border-[#d8ff30]/30 bg-[linear-gradient(90deg,#d1ff00_0%,#20d7ca_100%)] px-6 py-4 text-[2rem] font-black text-[#071006] shadow-[0_18px_40px_rgba(0,255,213,0.18),0_0_35px_rgba(216,255,48,0.22)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28),transparent_58%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                    <span className="relative z-10 inline-flex items-center gap-3">
                      {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : "Sign In"}
                      {!loading ? <MoveRight className="h-7 w-7 transition-transform duration-300 group-hover:translate-x-1" /> : null}
                    </span>
                  </motion.button>
                </form>

                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/12 to-white/4" />
                  <span className="text-[1.05rem] text-[#d0e4d5]/75">Or continue with</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/4 via-white/12 to-transparent" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SocialButton
                    label="Continue with Google"
                    icon={<FcGoogle size={22} />}
                    onClick={handleGoogleLogin}
                    loading={providerLoading === "google"}
                    disabled={loading || providerLoading === "github"}
                  />
                  <SocialButton
                    label="Continue with GitHub"
                    icon={<Github className="h-5 w-5" />}
                    onClick={handleGithubLogin}
                    loading={providerLoading === "github"}
                    disabled={loading || providerLoading === "google"}
                  />
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-base text-[#d3e0d2]/72">
                  <span>Don&apos;t have an account?</span>
                  <Link href="/register" className="group relative inline-flex items-center gap-2 font-semibold text-[#f4ffe6]">
                    <span className="relative">
                      Create now
                      <span className="absolute bottom-[-5px] left-0 h-[2px] w-0 bg-[#d8ff30] transition-all duration-300 group-hover:w-full" />
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}

function Logo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="inline-flex items-center gap-4"
    >
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-[0_0_40px_rgba(216,255,48,0.15)]">
        <Image
          src="/neon-code-logo.jpg"
          alt="NeonCode logo"
          width={64}
          height={64}
          className="h-14 w-14 rounded-xl object-cover"
          priority
        />
      </div>
      <div>
        <p className="text-[2.1rem] font-black tracking-[0.26em] text-[#f5ffe6]"><span className="text-[#d8ff30]">NEON</span>CODE</p>
      </div>
    </motion.div>
  );
}

// function TopControls() {
//   return (
//     <div className="absolute right-4 top-4 z-20 hidden items-center gap-4 lg:flex lg:right-8 lg:top-5">
//       <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[rgba(10,16,24,0.84)] px-5 py-3 text-lg text-white/90 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
//         <Globe className="h-5 w-5" />
//         <span className="font-medium">EN</span>
//         <ChevronDown className="h-4 w-4" />
//       </div>
//       <div className="inline-flex items-center gap-4 rounded-full border border-[#d8ff30]/25 bg-[rgba(10,16,24,0.84)] px-5 py-3 text-white shadow-[0_0_35px_rgba(216,255,48,0.08)]">
//         <span className="flex h-5 w-5 items-center justify-center text-white/80">
//           <span className="h-3.5 w-3.5 rounded-[4px] border border-current" />
//         </span>
//         <span className="h-6 w-6 rounded-full bg-[#d8ff30] shadow-[0_0_18px_rgba(216,255,48,0.7)]" />
//       </div>
//     </div>
//   );
// }

function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-50"
        animate={{ backgroundPosition: ["0px 0px", "0px 120px"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "linear-gradient(rgba(216,255,48,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,213,0.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(circle at center, black 38%, transparent 100%)",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,44,22,0.48),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(0,255,213,0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.38)_100%)]" />

      {PARTICLES.map((particle, index) => (
        <motion.span
          key={`${particle.left}-${particle.top}-${index}`}
          className="absolute rounded-full border border-[#d8ff30]/14 bg-[radial-gradient(circle,rgba(216,255,48,0.36),rgba(0,255,213,0.06)_55%,transparent_70%)] blur-[1px]"
          style={{
            width: particle.size,
            height: particle.size,
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [0, -24, 0],
            x: [0, 10, -6, 0],
            opacity: [0.28, 0.62, 0.26],
            scale: [1, 1.08, 0.96, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mt-12 hidden min-h-[420px] lg:block">
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(circle_at_center,rgba(216,255,48,0.14),transparent_62%)]" />
      <div className="absolute bottom-6 left-[12%] right-[8%] h-40 rounded-[30px] border border-[#1c3a22] bg-[linear-gradient(180deg,rgba(10,18,16,0.16),rgba(10,18,16,0.62))] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.06),transparent_12%),linear-gradient(rgba(216,255,48,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,213,0.06)_1px,transparent_1px)] bg-[length:auto,16px_16px,16px_16px] opacity-65" />
      </div>
      <motion.div
        animate={{ rotate: [0, 6, -2, 0], y: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[42%] top-1 h-12 w-12 rounded-2xl border border-[#d8ff30]/20 bg-[radial-gradient(circle,rgba(216,255,48,0.35),rgba(0,255,213,0.08))] shadow-[0_0_22px_rgba(216,255,48,0.18)]"
      />
      <motion.div
        animate={{ rotate: [18, 10, 18], x: [0, 14, -4, 0], y: [0, -12, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[33%] top-20 h-[19rem] w-[18rem] rounded-[46%] border border-[#8ff94d]/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(216,255,48,0.5),rgba(0,255,213,0.14)_66%,rgba(0,0,0,0.02))] shadow-[inset_0_0_70px_rgba(255,255,255,0.12),0_0_90px_rgba(153,255,64,0.14)]"
      />
      <motion.div
        animate={{ rotate: [-10, -16, -10], x: [0, -10, 0], y: [0, 8, 0] }}
        transition={{ duration: 10.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[38%] top-[8.5rem] h-[17.5rem] w-[7.5rem] rounded-[999px] border border-[#f6ff9d]/20 bg-[linear-gradient(180deg,rgba(252,255,226,0.3),rgba(216,255,48,0.92)_44%,rgba(36,255,210,0.1)_88%)] shadow-[0_0_60px_rgba(216,255,48,0.22)]"
      />
      <motion.div
        animate={{ rotate: [-36, -24, -32], x: [0, -12, 0], y: [0, 10, 0] }}
        transition={{ duration: 12.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[45%] top-[8.4rem] h-[14rem] w-[14rem] rounded-[42%] border border-[#00ffd5]/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),rgba(0,255,213,0.16),rgba(7,17,6,0.02))] shadow-[0_0_70px_rgba(0,255,213,0.12)] backdrop-blur-md"
      />
      <motion.div
        animate={{ rotate: [0, -3, 1, 0], y: [0, -10, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[27%] top-[5.55rem] h-[21rem] w-[17rem] rounded-[48%] border border-[#d8ff30]/14 bg-[linear-gradient(180deg,rgba(12,18,20,0.28),rgba(12,18,20,0.02))] shadow-[0_0_100px_rgba(0,0,0,0.38)]"
      />
      <motion.div
        animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[49%] top-[3.4rem] h-16 w-16 rounded-[20px] border border-[#d8ff30]/16 bg-[radial-gradient(circle,rgba(216,255,48,0.4),rgba(216,255,48,0.06)_55%,transparent_75%)] shadow-[0_0_24px_rgba(216,255,48,0.22)]"
      />
      <div className="absolute left-[18%] top-[17rem] h-px w-28 bg-white/12 rotate-[-24deg]" />
      <div className="absolute left-[13%] top-[22rem] h-px w-36 bg-white/12 rotate-[-24deg]" />
      <motion.div
        animate={{ x: [0, 12, 0], y: [0, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[20%] top-[18rem] h-10 w-10 rounded-full bg-[radial-gradient(circle,rgba(216,255,48,0.9),rgba(216,255,48,0.2)_40%,transparent_72%)] shadow-[0_0_24px_rgba(216,255,48,0.5)]"
      />
      <motion.div
        animate={{ x: [0, -10, 0], y: [0, 5, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[11%] top-[21rem] h-7 w-7 rounded-full bg-[radial-gradient(circle,rgba(216,255,48,0.95),rgba(216,255,48,0.18)_45%,transparent_72%)] shadow-[0_0_20px_rgba(216,255,48,0.5)]"
      />
    </div>
  );
}

function NeonInput({ label, icon: Icon, rightAction, onChange, ...props }) {
  return (
    <label className="block">
      <div className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04] transition duration-300 focus-within:border-[#d8ff30]/35 focus-within:shadow-[0_0_0_1px_rgba(216,255,48,0.15),0_0_30px_rgba(0,255,213,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_38%)] opacity-60" />
        <div className="relative flex items-center">
          <div className="pl-4 text-[#d8ff30]/86">
            <Icon className="h-5 w-5" />
          </div>
          <input
            {...props}
            required
            onChange={(event) => onChange?.(event.target.value)}
            className="h-15 w-full bg-transparent px-4 py-4 text-[15px] text-[#f6ffea] outline-none placeholder:text-[#cad8ca]/36 sm:text-base"
          />
          {rightAction ? <div className="pr-4">{rightAction}</div> : null}
        </div>
      </div>
    </label>
  );
}

function SocialButton({ label, icon, onClick, loading, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-14 items-center justify-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[#f2ffe4] transition duration-300 hover:border-[#00ffd5]/25 hover:bg-white/[0.07] hover:shadow-[0_0_30px_rgba(0,255,213,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  );
}
