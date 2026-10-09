"use client";

import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const THEME_KEY = "sporttek.play.theme";

export function LoginStage({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    setTheme(stored === "light" ? "light" : "dark");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
  }

  return (
    <div className="login-stage" data-theme={theme}>
      <aside className="login-visual" aria-hidden="true">
        <Image
          className="login-visual__photo"
          src="/brand/login-sports.png"
          alt=""
          fill
          sizes="(min-width: 900px) 55vw, 100vw"
          priority
        />
        <div className="login-visual__wash" />
        <div className="login-visual__brand">
          <Image
            src="/brand/sporttek-mark.png"
            alt=""
            width={56}
            height={56}
            className="login-visual__mark"
          />
          <p className="login-visual__line">Courts that fill themselves.</p>
        </div>
      </aside>
      <section className="login-panel">
        <div className="login-panel__tools">
          <button
            type="button"
            className="login-theme-toggle"
            aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
            title={theme === "dark" ? "Light" : "Dark"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
