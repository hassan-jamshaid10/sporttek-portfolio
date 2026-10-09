"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/play/AppShell";

const AUTH_PREFIXES = ["/play/login", "/play/otp"];

function isAuthRoute(pathname: string) {
  return AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Full-bleed pages (hero / ticket) skip the default main padding. */
function isFlushPath(pathname: string) {
  if (pathname === "/play/checkout") return true;
  if (/^\/play\/venues\/[^/]+$/.test(pathname)) return true;
  if (/^\/play\/venues\/[^/]+\/slots$/.test(pathname)) return true;
  if (/^\/play\/bookings\/[^/]+$/.test(pathname)) return true;
  return false;
}

/**
 * Keeps AppShell mounted across /play navigations so /api/auth/me is not
 * re-fetched on every page. Login/OTP stay outside the shell.
 */
export function PlayFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/play";
  if (isAuthRoute(pathname)) {
    return <>{children}</>;
  }
  return <AppShell flush={isFlushPath(pathname)}>{children}</AppShell>;
}
