"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const PULSE_BARS = [0, 1, 2, 3, 4];

export default function Loader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] overflow-hidden bg-[#000f08] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,44,22,0.5),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(0,255,213,0.08),transparent_22%),linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.36))]" />
      <motion.div
        className="absolute inset-0 opacity-40"
        animate={{ backgroundPosition: ["0px 0px", "0px 96px"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "linear-gradient(rgba(216,255,48,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,213,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(circle at center, black 30%, transparent 90%)",
        }}
      />

      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="relative w-full max-w-[480px] rounded-[34px] border border-[#d8ff30]/14 bg-[linear-gradient(180deg,rgba(9,14,20,0.84),rgba(6,10,18,0.92))] px-8 py-12 shadow-[0_30px_120px_rgba(0,0,0,0.5),0_0_50px_rgba(0,255,213,0.08)] backdrop-blur-[22px]">
          <div className="pointer-events-none absolute inset-[1px] rounded-[33px] border border-white/5" />
          <motion.div
            className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-[#d8ff30]/12 blur-3xl"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-8 bottom-10 h-24 w-24 rounded-full bg-[#00ffd5]/12 blur-3xl"
            animate={{ opacity: [0.25, 0.7, 0.25] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] border border-[#d8ff30]/24 bg-[linear-gradient(145deg,rgba(216,255,48,0.1),rgba(0,255,213,0.06))] shadow-[0_0_45px_rgba(216,255,48,0.12)]"
            >
              <motion.div
                className="absolute inset-0 rounded-[28px] border border-white/6"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              />
              <Image
                src="/Neon Studio icon.png"
                alt="NeonCode logo"
                width={60}
                height={60}
                className="h-14 w-14 object-contain"
                priority
              />
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="text-[2rem] font-black tracking-[0.26em] text-[#f5ffe6]"
            >
              <span className="text-[#d8ff30]">NEON</span>CODE
            </motion.div>

            <p className="mt-3 text-xs uppercase tracking-[0.38em] text-[#d1e3d5]/52">
              Initializing Creative Workspace
            </p>

            <div className="mt-8 flex items-end gap-2">
              {PULSE_BARS.map((bar) => (
                <motion.span
                  key={bar}
                  className="w-2 rounded-full bg-[linear-gradient(180deg,#d8ff30,#00ffd5)] shadow-[0_0_18px_rgba(0,255,213,0.2)]"
                  animate={{ height: [10, 32, 18, 38, 10] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: bar * 0.12,
                  }}
                />
              ))}
            </div>

            <div className="mt-8 w-full max-w-[260px] overflow-hidden rounded-full border border-white/8 bg-white/[0.04] p-1">
              <motion.div
                className="h-2 rounded-full bg-[linear-gradient(90deg,#d8ff30_0%,#00ffd5_100%)] shadow-[0_0_24px_rgba(216,255,48,0.22)]"
                animate={{ x: ["-110%", "110%"] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <motion.p
              className="mt-6 text-sm text-[#d6e5d6]/68"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              Loading premium experience...
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
