"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/** Full-page / inline SportTek loader — Photoroom avatar is never theme-tinted. */
export function BrandLoader({
  label,
  variant = "fullscreen",
}: {
  label: string;
  variant?: "fullscreen" | "inline" | "sm";
}) {
  return (
    <div
      className={cn(
        "brand-loader",
        variant === "inline" && "brand-loader--inline",
        variant === "sm" && "brand-loader--inline brand-loader--sm",
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="brand-loader__orbit" aria-hidden="true">
        <span className="brand-loader__ring" />
        <span className="brand-loader__ring brand-loader__ring--inner" />
        <span className="brand-loader__glow" />
        <Image
          className="brand-loader__mark"
          src="/sporttek-avatar-Photoroom.png"
          alt=""
          width={88}
          height={88}
          priority
          unoptimized
        />
      </div>
      {variant !== "sm" ? (
        <>
          <p className="brand-loader__wordmark">
            Sport<span>Tek</span>
          </p>
          <p className="brand-loader__label">{label}</p>
        </>
      ) : null}
    </div>
  );
}
