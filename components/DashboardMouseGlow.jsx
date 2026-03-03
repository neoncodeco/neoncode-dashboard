"use client";

import { useEffect } from "react";

export default function DashboardMouseGlow() {
  useEffect(() => {
    const handleMove = (e) => {
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return null;
}

