"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  CalendarDays,
  ChevronRight,
  Heart,
  LogOut,
  MessageSquareHeart,
  Phone,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { ContactDialog } from "@/components/play/contact-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sportLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Me } from "@/lib/types";

function initials(name?: string, phone?: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  if (parts.length === 1 && parts[0]!.length > 0) return parts[0]!.slice(0, 2).toUpperCase();
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.slice(-2) || "ST";
}

const NAV = [
  { href: "/play/profile", label: "View profile", icon: UserRound },
  { href: "/play/bookings", label: "My bookings", icon: CalendarDays },
  { href: "/play/favourites", label: "My favourites", icon: Heart },
  { href: "/play/alerts", label: "Slot alerts", icon: BellRing },
  { href: "/play/feedback", label: "Feedback", icon: MessageSquareHeart },
] as const;

function Avatar({
  photo,
  name,
  phone,
  size,
}: {
  photo?: string;
  name: string;
  phone?: string;
  size: "sm" | "lg";
}) {
  const dim = size === "lg" ? "h-12 w-12 text-sm sm:h-14 sm:w-14 sm:text-base" : "h-8 w-8 text-[11px]";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#65AA2B] bg-neutral-100 font-extrabold text-[#17354F] dark:bg-[#0F1C28] dark:text-white",
        dim,
      )}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name, phone)}</span>
      )}
    </span>
  );
}

export function PlayUserMenu({
  me,
  onLoggedOut,
}: {
  me: Me;
  onLoggedOut: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const phone = me.phoneE164 ?? me.phone;
  const photo = me.photoUrl ?? me.avatarUrl;
  const name = me.fullName?.trim() || "Player";
  const sports = me.preferredSports ?? [];
  const sport = sports[0] ? sportLabel(sports[0]) : null;

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* clear anyway */
    }
    const { clearPlayMe, writePlayMe } = await import("@/lib/play-me");
    clearPlayMe();
    writePlayMe(null);
    onLoggedOut();
    setBusy(false);
    router.push("/play");
    router.refresh();
  }

  return (
    <>
      {busy ? <BrandLoader label="Signing out" /> : null}
      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-9 max-w-[9.5rem] gap-1.5 rounded-full border border-black/[0.06] bg-white pl-1 pr-2 text-[#17354F] shadow-sm hover:bg-neutral-50 sm:h-11 sm:max-w-[14rem] sm:gap-2.5 sm:pl-1.5 sm:pr-3.5 dark:border-white/10 dark:bg-[#17354F] dark:text-white dark:hover:bg-[#1f4463]"
            aria-label="Account menu"
          >
            <Avatar photo={photo} name={name} phone={phone} size="sm" />
            <span className="hidden min-w-0 truncate text-sm font-extrabold md:inline">{name}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={10}
          collisionPadding={12}
          className="w-[min(20rem,calc(100vw-1.25rem))] max-h-[min(34rem,calc(100dvh-4.5rem))] overflow-y-auto p-0"
        >
          <div className="border-b border-black/[0.06] px-4 py-4 dark:border-white/10">
            <div className="flex items-start gap-3">
              <Avatar photo={photo} name={name} phone={phone} size="lg" />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate text-[15px] font-extrabold leading-tight text-[#17354F] dark:text-white sm:text-base">
                  {name}
                </p>
                {phone ? (
                  <p className="mt-1 truncate text-xs font-semibold text-neutral-500 dark:text-white/55 sm:text-sm">
                    {phone}
                  </p>
                ) : null}
                {sport ? (
                  <span className="mt-2 inline-flex rounded-md bg-[#65AA2B]/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#4F8F38] dark:bg-[#65AA2B]/25 dark:text-[#D4E22A]">
                    {sport}
                    {sports.length > 1 ? ` · +${sports.length - 1}` : ""}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 p-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.href}
                  asChild
                  className="min-h-11 rounded-xl px-3 py-2.5 data-[highlighted]:bg-[#65AA2B]/10 dark:data-[highlighted]:bg-white/10"
                >
                  <Link href={item.href} className="!items-center !gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F4DC] text-[#4F8F38] dark:bg-[#1E3A24] dark:text-[#D4E22A]">
                      <Icon size={16} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-extrabold">
                      {item.label}
                    </span>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-neutral-300 dark:text-white/25"
                      aria-hidden
                    />
                  </Link>
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuItem
              className="min-h-11 rounded-xl px-3 py-2.5 data-[highlighted]:bg-[#65AA2B]/10 dark:data-[highlighted]:bg-white/10"
              onSelect={() => {
                // Let the menu close first, then open the portaled sheet.
                window.setTimeout(() => setContactOpen(true), 0);
              }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F4DC] text-[#4F8F38] dark:bg-[#1E3A24] dark:text-[#D4E22A]">
                <Phone size={16} aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-extrabold">Contact us</span>
              <ChevronRight
                size={14}
                className="shrink-0 text-neutral-300 dark:text-white/25"
                aria-hidden
              />
            </DropdownMenuItem>
          </div>

          <div className="border-t border-black/[0.06] p-2 dark:border-white/10">
            <DropdownMenuItem
              className={cn(
                "min-h-11 rounded-xl px-3 text-red-600",
                "data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700",
                "dark:text-red-300 dark:data-[highlighted]:bg-red-950/40",
              )}
              onSelect={() => void logout()}
            >
              <LogOut size={16} aria-hidden />
              Log out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
