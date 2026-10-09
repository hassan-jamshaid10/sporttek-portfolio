"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Mobile parity: `Strings.brandTagline` in sporttek-mobile. */
const TAGLINE = "Find. Book. Play.";
const SWAP_MS = 2000;
const ANIM_MS = 260;

export function PlayWordmark({ className }: { className?: string }) {
  const [showTagline, setShowTagline] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAnimating(true);
      window.setTimeout(() => {
        setShowTagline((v) => !v);
        setAnimating(false);
      }, ANIM_MS);
    }, SWAP_MS);
    return () => window.clearInterval(id);
  }, []);

  const brand = (
    <span className="whitespace-nowrap">
      <span className="text-[#17354F] dark:text-white">Sport</span>
      <span className="text-[#65AA2B]">Tek</span>
    </span>
  );
  const tagline = (
    <span className="whitespace-nowrap text-[#4F8F38] dark:text-[#D4E22A]">{TAGLINE}</span>
  );
  const current = showTagline ? tagline : brand;
  const next = showTagline ? brand : tagline;

  return (
    <Link
      href="/play"
      className={cn("flex min-w-0 max-w-full shrink items-center gap-2 sm:gap-2.5", className)}
      aria-label="SportTek"
    >
      {/* Plain img avoids DOM Image constructor clash with next/image under Turbopack */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/sporttek-mark.png"
        alt=""
        width={34}
        height={34}
        className="h-8 w-8 shrink-0 sm:h-[34px] sm:w-[34px]"
      />
      <span className="relative hidden h-[1.25rem] overflow-hidden text-base font-extrabold leading-none tracking-tight min-[380px]:block sm:h-[1.35rem] sm:text-[1.15rem]">
        <span
          className={cn(
            "absolute inset-y-0 left-0 flex items-center transition-all duration-[260ms] ease-out",
            animating ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
          )}
        >
          {current}
        </span>
        <span
          className={cn(
            "absolute inset-y-0 left-0 flex items-center transition-all duration-[260ms] ease-out",
            animating ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
          )}
          aria-hidden
        >
          {next}
        </span>
        {/* Reserve width for the longer of the two labels */}
        <span className="invisible whitespace-nowrap">{TAGLINE}</span>
      </span>
    </Link>
  );
}
