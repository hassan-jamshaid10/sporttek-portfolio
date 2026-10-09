"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  CalendarDays,
  Camera,
  Heart,
  LogOut,
  MessageSquareHeart,
  Pencil,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayUi } from "@/components/play/AppShell";
import { BrandLoader } from "@/components/play/brand-loader";
import { SPORTS, type SportCode } from "@/components/play/venue-filter-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiFetch, backendApi } from "@/lib/api";
import { messageForCode } from "@/lib/auth-messages";
import { sportLabel } from "@/lib/labels";
import { clearPlayMe, writePlayMe } from "@/lib/play-me";
import { cn } from "@/lib/utils";
import type { Me } from "@/lib/types";

const QUICK_LINKS = [
  {
    href: "/play/bookings",
    label: "My bookings",
    hint: "Upcoming and past courts",
    icon: CalendarDays,
  },
  {
    href: "/play/favourites",
    label: "My favourites",
    hint: "Venues you saved",
    icon: Heart,
  },
  {
    href: "/play/alerts",
    label: "Slot alerts",
    hint: "Get notified when slots open",
    icon: BellRing,
  },
  {
    href: "/play/feedback",
    label: "Feedback",
    hint: "Tell us what to improve",
    icon: MessageSquareHeart,
  },
] as const;

function initials(name?: string, phone?: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  if (parts.length === 1 && parts[0]!.length > 0) return parts[0]!.slice(0, 2).toUpperCase();
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.slice(-2) || "ST";
}

function phoneOf(me: Me | null) {
  return me?.phoneE164 ?? me?.phone ?? "";
}

function photoOf(me: Me | null) {
  return me?.photoUrl ?? me?.avatarUrl ?? "";
}

export function ProfileDesk() {
  const router = useRouter();
  const { me, authChecked, refreshMe } = usePlayUi();
  const [editOpen, setEditOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!authChecked) return;
    if (!me) {
      router.replace(`/play/login?next=${encodeURIComponent("/play/profile")}`);
    }
  }, [authChecked, me, router]);

  if (!authChecked || !me) {
    return <BrandLoader label="Loading profile" />;
  }

  const profile = me;
  const name = profile.fullName?.trim() || "Player";
  const phone = phoneOf(profile);
  const photo = photoOf(profile);
  const sports = profile.preferredSports ?? [];
  const badge = sports[0] ? sportLabel(sports[0]) : "Player";

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* clear anyway */
    }
    clearPlayMe();
    writePlayMe(null);
    await refreshMe();
    setLoggingOut(false);
    router.replace("/play");
    router.refresh();
  }

  async function uploadPhoto(file: File) {
    setPhotoBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      await apiFetch(backendApi("api/v1/me/photo"), { method: "POST", body: form });
      await refreshMe();
    } catch (err) {
      const api = err as ApiError;
      setError(messageForCode(api.messageCode, api.message, api.fields));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    setError(null);
    try {
      await apiFetch(backendApi("api/v1/me/photo"), { method: "DELETE" });
      await refreshMe();
    } catch (err) {
      const api = err as ApiError;
      setError(messageForCode(api.messageCode, api.message, api.fields));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function shareProfile() {
    const text = profile.fullName?.trim()
      ? `${profile.fullName.trim()} is on SportTek. Find, book and play. https://sporttek.pk`
      : "I'm on SportTek. Find, book and play. https://sporttek.pk";
    try {
      if (navigator.share) {
        await navigator.share({ title: "SportTek", text, url: "https://sporttek.pk" });
        setShareNote("Shared");
        window.setTimeout(() => setShareNote(null), 1600);
        return;
      }
    } catch {
      /* fall through */
    }
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setShareNote("Opened WhatsApp");
    window.setTimeout(() => setShareNote(null), 1600);
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-8 pb-12">
      {(photoBusy || loggingOut) && (
        <BrandLoader label={loggingOut ? "Signing out" : "Updating photo"} />
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17354F] dark:text-white sm:text-4xl">
            Your profile
          </h1>
          <p className="mt-1.5 max-w-xl text-base font-medium text-neutral-500 dark:text-white/55">
            Manage your photo, details, and shortcuts across SportTek.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            className="h-11 rounded-xl bg-gradient-to-br from-[#4F8F38] to-[#66AB27] px-5 text-white"
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={16} />
            Edit profile
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl px-5"
            onClick={() => void shareProfile()}
          >
            <Share2 size={16} />
            {shareNote ?? "Share"}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        {/* Identity card: left column on web */}
        <section className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-[0_12px_32px_rgba(23,53,79,0.08)] dark:border-white/10 dark:bg-[#17354F] lg:sticky lg:top-24">
          <div className="flex flex-col items-center text-center lg:items-stretch lg:text-left">
            <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-start">
              <div className="relative shrink-0">
                <button
                  type="button"
                  disabled={photoBusy}
                  aria-label="Change profile photo"
                  className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-[#65AA2B] bg-neutral-100 shadow-[0_10px_28px_rgba(79,143,56,0.25)] dark:bg-[#0F1C28]"
                  onClick={() => document.getElementById("profile-photo-input")?.click()}
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-[#17354F] dark:text-white">
                      {initials(name, phone)}
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-[#17354F]/80 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                    <Camera size={12} />
                    Photo
                  </span>
                </button>
                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadPhoto(file);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <span className="inline-flex rounded-full bg-[#E8F4DC] px-3 py-1 text-xs font-extrabold text-[#4F8F38] dark:bg-[#1E3A24] dark:text-[#D4E22A]">
                  {badge}
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#17354F] dark:text-white">
                  {name}
                </h2>
                {phone ? (
                  <p className="text-sm font-semibold text-neutral-500 dark:text-white/55">{phone}</p>
                ) : null}
                {sports.length > 1 ? (
                  <p className="text-sm font-medium text-neutral-500 dark:text-white/50">
                    {sports.map(sportLabel).join(" · ")}
                  </p>
                ) : null}
                {photo ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline dark:text-red-300"
                    disabled={photoBusy}
                    onClick={() => void removePhoto()}
                  >
                    <Trash2 size={13} />
                    Remove photo
                  </button>
                ) : (
                  <p className="text-xs font-semibold text-neutral-400 dark:text-white/45">
                    Click the photo to upload
                  </p>
                )}
              </div>
            </div>

            <dl className="mt-7 grid gap-3 border-t border-black/[0.06] pt-6 dark:border-white/10 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-neutral-50 px-4 py-3 dark:bg-white/5">
                <dt className="text-[11px] font-extrabold uppercase tracking-wide text-neutral-400 dark:text-white/45">
                  Account
                </dt>
                <dd className="mt-1 text-sm font-extrabold text-[#17354F] dark:text-white">
                  {profile.profileComplete ? "Complete" : "Needs name"}
                </dd>
              </div>
              <div className="rounded-2xl bg-neutral-50 px-4 py-3 dark:bg-white/5">
                <dt className="text-[11px] font-extrabold uppercase tracking-wide text-neutral-400 dark:text-white/45">
                  Preferred sports
                </dt>
                <dd className="mt-1 text-sm font-extrabold text-[#17354F] dark:text-white">
                  {sports.length ? sports.map(sportLabel).join(", ") : "Not set"}
                </dd>
              </div>
            </dl>

            <Button
              type="button"
              variant="outline"
              className="mt-6 h-11 w-full rounded-xl border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
              onClick={() => void logout()}
            >
              <LogOut size={16} />
              Sign out
            </Button>
          </div>
        </section>

        {/* Shortcuts grid: web card layout */}
        <section>
          <h3 className="text-lg font-extrabold tracking-tight text-[#17354F] dark:text-white">
            Shortcuts
          </h3>
          <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-white/55">
            Jump to bookings, saved venues, and alerts.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_24px_rgba(23,53,79,0.05)] transition hover:-translate-y-0.5 hover:border-[#65AA2B]/35 hover:shadow-[0_14px_32px_rgba(23,53,79,0.1)] dark:border-white/10 dark:bg-[#17354F]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F4DC] text-[#4F8F38] transition group-hover:bg-[#4F8F38] group-hover:text-white dark:bg-[#1E3A24] dark:text-[#D4E22A] dark:group-hover:bg-[#65AA2B] dark:group-hover:text-[#071018]">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-extrabold text-[#17354F] dark:text-white">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-sm font-medium text-neutral-500 dark:text-white/55">
                      {item.hint}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {editOpen ? (
        <EditProfileDialog
          me={profile}
          onClose={() => setEditOpen(false)}
          onSaved={async (next) => {
            writePlayMe(next);
            await refreshMe();
            setEditOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function EditProfileDialog({
  me,
  onClose,
  onSaved,
}: {
  me: Me;
  onClose: () => void;
  onSaved: (me: Me) => Promise<void>;
}) {
  const [name, setName] = useState(me.fullName ?? "");
  const [sports, setSports] = useState<SportCode[]>(() =>
    (me.preferredSports ?? []).filter((s): s is SportCode =>
      (SPORTS as readonly string[]).includes(s),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const fullName = name.trim();
    if (fullName.length < 1) {
      setError("Enter your name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(backendApi("api/v1/me"), {
        method: "PATCH",
        json: {
          fullName,
          ...(sports.length ? { preferredSports: sports } : {}),
        },
      });
      await onSaved({
        ...me,
        fullName,
        preferredSports: sports,
        profileComplete: true,
      });
    } catch (err) {
      const api = err as ApiError;
      setError(messageForCode(api.messageCode, api.message, api.fields));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1C28]/55 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-7 shadow-[0_24px_60px_rgba(23,53,79,0.28)] dark:bg-[#152636] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2
              id="edit-profile-title"
              className="text-xl font-extrabold text-[#17354F] dark:text-white"
            >
              Edit profile
            </h2>
            <p className="mt-1 text-sm font-semibold text-neutral-500 dark:text-white/55">
              Name and sports you play most.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs font-extrabold uppercase tracking-wide text-neutral-400">
          Full name
        </label>
        <Input
          className="mt-2 h-12 rounded-xl dark:border-white/15 dark:bg-[#0F1C28] dark:text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
        />

        <p className="mb-2 mt-6 text-xs font-extrabold uppercase tracking-wide text-neutral-400">
          Preferred sports
        </p>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map((sport) => {
            const on = sports.includes(sport);
            return (
              <button
                key={sport}
                type="button"
                className={cn(
                  "rounded-full px-3.5 py-2 text-xs font-bold transition",
                  on
                    ? "bg-[#17354F] text-white dark:bg-[#65AA2B] dark:text-[#071018]"
                    : "bg-neutral-100 text-[#17354F] dark:bg-white/10 dark:text-white",
                )}
                onClick={() =>
                  setSports((prev) =>
                    on ? prev.filter((s) => s !== sport) : [...prev, sport],
                  )
                }
              >
                {sportLabel(sport)}
              </button>
            );
          })}
        </div>

        {error ? (
          <p className="mt-4 text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
        ) : null}

        <div className="mt-8 flex justify-end gap-2.5">
          <Button type="button" variant="outline" className="h-11 rounded-xl px-5" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            className="h-11 rounded-xl bg-gradient-to-br from-[#4F8F38] to-[#66AB27] px-5 text-white"
            onClick={() => void save()}
          >
            {busy ? (
              "Saving…"
            ) : (
              <>
                <Upload size={15} />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
