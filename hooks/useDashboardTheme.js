"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "dashboard-theme";
const DEFAULT_THEME = "light";
const THEME_EVENT = "dashboard-theme-change";

function getThemeSnapshot() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : DEFAULT_THEME;
}

function subscribe(onStoreChange) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event) => {
    if (!event.key || event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  const handleThemeChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_EVENT, handleThemeChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_EVENT, handleThemeChange);
  };
}

function updateTheme(nextTheme) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, nextTheme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export default function useDashboardTheme() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => DEFAULT_THEME);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      window.localStorage.setItem(STORAGE_KEY, DEFAULT_THEME);
    }

    document.documentElement.setAttribute("data-dashboard-theme", theme);
  }, [theme]);

  return {
    theme,
    setTheme: updateTheme,
    toggleTheme: () => updateTheme(theme === "dark" ? "light" : "dark"),
    isDark: theme === "dark",
  };
}
