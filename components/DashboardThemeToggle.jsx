"use client";

import { Moon, Sun } from "lucide-react";

export default function DashboardThemeToggle({
  theme,
  toggleTheme,
  className = "",
  compact = false,
}) {
  const isDark = theme === "dark";
  const label = isDark ? "Dark mode" : "Light mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={`theme-toggle inline-flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${className}`.trim()}
    >
      <span className="theme-toggle__icon inline-flex h-9 w-9 items-center justify-center rounded-xl">
        {isDark ? <Moon size={18} /> : <Sun size={18} />}
      </span>
      <span className="min-w-0 text-left leading-tight">
        <span className="block">{label}</span>
        {!compact ? (
          <span className="theme-toggle__meta block text-[11px] font-medium">
            {isDark ? "Current neon look" : "Bright readable layout"}
          </span>
        ) : null}
      </span>
    </button>
  );
}
