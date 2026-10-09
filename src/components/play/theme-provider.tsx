"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

export type PlayTheme = "light" | "dark";

const STORAGE_KEY = "sporttek.play.theme";

type ThemeContextValue = {
  theme: PlayTheme;
  setTheme: (theme: PlayTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => undefined,
});

export function readStoredPlayTheme(): PlayTheme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function applyPlayThemeClass(theme: PlayTheme) {
  const on = theme === "dark";
  document.documentElement.classList.toggle("dark", on);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function runThemeChange(next: PlayTheme, apply: () => void) {
  const reduced = prefersReducedMotion();
  const doc = document as Document & {
    startViewTransition?: (update: () => void) => { finished: Promise<void> };
  };
  const html = document.documentElement;
  if (reduced || typeof doc.startViewTransition !== "function") {
    apply();
    return;
  }
  // Same wipe directions as sporttek-panel ThemeProvider
  html.dataset.themeWipe = next === "dark" ? "down" : "right";
  const transition = doc.startViewTransition(() => {
    flushSync(apply);
  });
  void transition.finished.finally(() => {
    delete html.dataset.themeWipe;
  });
}

export function PlayThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<PlayTheme>("light");

  useEffect(() => {
    const next = readStoredPlayTheme();
    setThemeState(next);
    applyPlayThemeClass(next);
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (next) => {
        if (next === theme) return;
        runThemeChange(next, () => {
          setThemeState(next);
          window.localStorage.setItem(STORAGE_KEY, next);
          applyPlayThemeClass(next);
        });
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function usePlayTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
