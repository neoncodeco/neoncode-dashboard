// components/Preloader.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Loader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ২.৫ সেকেন্ড পর লোডার বন্ধ হবে
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }} 
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] text-white"
        >
          
          {/* === ১. মডার্ন নিয়ন স্পিনার === */}
          <div className="relative flex items-center justify-center w-64 h-64">
            
            {/* আউটার রিং (বড় - নীল) */}
            <motion.span
              className="absolute w-full h-full border-4 border-transparent border-t-blue-500 border-b-blue-500 rounded-full box-border"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" }} // ব্লু গ্লো
            ></motion.span>

            {/* মেডেল রিং (মাঝারি - বেগুনি - উল্টো ঘুরবে) */}
            <motion.span
              className="absolute w-40 h-40 border-4 border-transparent border-l-purple-500 border-r-purple-500 rounded-full box-border"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)" }} // পার্পল গ্লো
            ></motion.span>

            {/* ইনার রিং (ছোট - পিঙ্ক) */}
            <motion.span
              className="absolute w-20 h-20 border-4 border-transparent border-t-pink-500 rounded-full box-border"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            ></motion.span>

            {/* সেন্ট্রাল পালস ডট */}
            <motion.div
              className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            ></motion.div>

          </div>

          {/* === ২. টেক্সট এবং প্রোগ্রেস বার === */}
          <div className="mt-12 flex flex-col items-center">
            <h2 className="text-2xl font-bold tracking-[0.3em] text-white uppercase animate-pulse">
              Neon Studio
            </h2>
            
            {/* সরু লোডিং লাইন */}
            <div className="w-48 h-[2px] bg-gray-800 mt-4 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.2, ease: "easeInOut" }}
                ></motion.div>
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}