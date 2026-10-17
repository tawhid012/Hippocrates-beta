"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  const applyTheme = useCallback((targetTheme: "dark" | "light") => {
    setResolvedTheme(targetTheme);
    const root = document.documentElement;

    if (targetTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }

    // Update meta theme-color for browser navigation bar and Android status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const colorHex = targetTheme === "dark" ? "#090d16" : "#ffffff";
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", colorHex);
    }

    // Synchronize Capacitor native Android status bar
    try {
      if (typeof window !== "undefined" && "Capacitor" in window) {
        StatusBar.setBackgroundColor({ color: colorHex }).catch(() => {});
        StatusBar.setStyle({
          style: targetTheme === "dark" ? Style.Dark : Style.Light,
        }).catch(() => {});
      }
    } catch {
      // Non-Capacitor environment
    }
  }, []);

  useEffect(() => {
    // Read saved preference or default to system device theme
    const saved = localStorage.getItem("hippocrates-theme") as Theme | null;
    const initialTheme: Theme = saved || "system";
    setThemeState(initialTheme);

    if (initialTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    } else {
      applyTheme(initialTheme);
    }

    // Listen to OS system color scheme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const current = localStorage.getItem("hippocrates-theme") as Theme | null;
      if (!current || current === "system") {
        applyTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [applyTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem("hippocrates-theme", newTheme);

      try {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } catch {}

      if (newTheme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(prefersDark ? "dark" : "light");
      } else {
        applyTheme(newTheme);
      }
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
