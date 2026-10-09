"use client";

import { Moon, Sun } from "lucide-react";
import { usePlayTheme } from "@/components/play/theme-provider";
import { Button } from "@/components/ui/button";

export function PlayThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = usePlayTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className={`border-black/10 ${className}`.trim()}
      aria-label={next === "dark" ? "Switch to dark" : "Switch to light"}
      title={next === "dark" ? "Dark" : "Light"}
      onClick={() => setTheme(next)}
    >
      {theme === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </Button>
  );
}
