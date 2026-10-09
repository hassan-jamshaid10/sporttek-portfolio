"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Tag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayUi } from "@/components/play/AppShell";
import { BrandLoader } from "@/components/play/brand-loader";
import { Button } from "@/components/ui/button";
import { apiFetch, publicApi } from "@/lib/api";
import { venueCoverSrc } from "@/lib/demo-cover";
import { loadPlayMe } from "@/lib/play-me";
import {
  addDaysIso,
  dayNumFromIso,
  formatHmDisplay,
  formatTime,
  isWeekendIso,
  karachiDateInput,
  moneyDisplay,
  monthShortFromIso,
  weekdayShortFromIso,
} from "@/lib/format";
import { sportLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { AvailabilityDay, CourtAvailability, Slot, VenueDetail } from "@/lib/types";

function courtLabel(court: CourtAvailability) {
  return court.courtName ?? court.name ?? "Court";
}

function slotsForDuration(court: CourtAvailability, duration: number): Slot[] {
  const all = court.slots ?? [];
  const native = all.filter((s) => (s.durationMinutes ?? duration) === duration);
  if (native.length) return native;
  return all.filter((s) => s.durationMinutes === court.defaultDuration);
}

/** Karachi wall-clock HH:mm — same as mobile DualClockText secondary line. */
function hmFromIso(iso?: string) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

function slotPlayerLabel(state?: string) {
  if (state === "CUTOFF") return "Cutoff";
  if (state === "BLOCKED") return "Blocked";
  return "Taken";
}

export function SlotPickerDesk({
  slugOrId,
  initialDate,
  initialCourtId,
  initialStart,
}: {
  slugOrId: string;
  initialDate?: string;
  initialCourtId?: string;
  initialStart?: string;
}) {
  const router = useRouter();
  const { me, authChecked } = usePlayUi();
  const today = useMemo(() => karachiDateInput(), []);
  const cameFromDetail = Boolean(initialDate);
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [date, setDate] = useState(initialDate || today);
  const [day, setDay] = useState<AvailabilityDay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [courtId, setCourtId] = useState(initialCourtId || "");
  const [duration, setDuration] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ court: CourtAvailability; slot: Slot } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const timeSectionRef = useRef<HTMLElement | null>(null);
  const didAutoOpen = useRef(false);

  const horizon = useMemo(() => {
    const days = day?.bookingHorizonDays ?? 13;
    return Array.from({ length: days + 1 }, (_, i) => addDaysIso(today, i));
  }, [today, day?.bookingHorizonDays]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const body = await apiFetch<VenueDetail>(publicApi(`api/v1/venues/${slugOrId}`));
        if (!cancelled) setVenue(body);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setSelected(null);
      try {
        const body = await apiFetch<AvailabilityDay>(
          publicApi(`api/v1/venues/${slugOrId}/availability?date=${encodeURIComponent(date)}`),
        );
        if (cancelled) return;
        setDay(body);
        const courts = body.courts ?? [];
        const next =
          (courtId && courts.find((c) => c.courtId === courtId)) || courts[0] || null;
        if (next?.courtId) {
          setCourtId(next.courtId);
          setDuration((prev) => {
            const allowed = next.durations ?? [];
            if (prev != null && allowed.includes(prev)) return prev;
            return next.defaultDuration ?? allowed[0] ?? 60;
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load slots.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugOrId, date]);

  const courts = day?.courts ?? [];
  const court = courts.find((c) => c.courtId === courtId) ?? courts[0] ?? null;
  const activeDuration = duration ?? court?.defaultDuration ?? 60;

  const slots = useMemo(() => {
    if (!court) return [] as Slot[];
    return slotsForDuration(court, activeDuration)
      .filter((s) => s.state !== "PAST")
      .sort((a, b) => (a.startAt ?? "").localeCompare(b.startAt ?? ""));
  }, [court, activeDuration]);

  // Detail page passed a date (and optional start) — jump straight to the time grid.
  useEffect(() => {
    if (!cameFromDetail || loading || !court || didAutoOpen.current) return;
    didAutoOpen.current = true;

    if (initialStart && !selected) {
      const match = slots.find(
        (s) => s.state === "AVAILABLE" && hmFromIso(s.startAt) === initialStart,
      );
      if (match) setSelected({ court, slot: match });
    }

    const id = window.setTimeout(() => {
      timeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(id);
  }, [cameFromDetail, loading, court, slots, initialStart, selected]);

  const sports = [
    ...new Set(
      (venue?.sports?.length
        ? venue.sports
        : courts.map((c) => c.sport).filter(Boolean)) as string[],
    ),
  ];
  const cover = venueCoverSrc(
    venue?.coverPhotoUrl || venue?.photos?.[0]?.url,
    sports,
    venue?.name,
  );

  function openConfirm() {
    if (!selected?.slot.startAt || !selected.court.courtId) return;
    setConfirmOpen(true);
  }

  function checkoutQuery() {
    if (!selected?.slot.startAt || !selected.court.courtId) return null;
    const q = new URLSearchParams({
      venueId: slugOrId,
      courtId: selected.court.courtId,
      startAt: selected.slot.startAt,
      durationMinutes: String(selected.slot.durationMinutes ?? activeDuration),
      courtName: courtLabel(selected.court),
      price: selected.slot.price?.display ?? "",
    });
    if (selected.slot.price?.paisa != null) q.set("pricePaisa", String(selected.slot.price.paisa));
    if (selected.slot.listPrice?.display) q.set("listPrice", selected.slot.listPrice.display);
    if (selected.slot.dealId) q.set("dealId", selected.slot.dealId);
    if (selected.slot.promoCode) q.set("promoCode", selected.slot.promoCode);
    if (venue?.name) q.set("venueName", venue.name);
    return q;
  }

  async function goToPayment() {
    const q = checkoutQuery();
    if (!q) return;
    const checkoutPath = `/play/checkout?${q.toString()}`;
    setConfirmBusy(true);
    try {
      const user = authChecked ? me : await loadPlayMe();
      if (!user) {
        setConfirmOpen(false);
        router.push(`/play/login?next=${encodeURIComponent(checkoutPath)}`);
        return;
      }
      setConfirmOpen(false);
      router.push(checkoutPath);
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="pb-28">
      {/* Court photo behind back + title only */}
      <section className="relative isolate overflow-hidden bg-[#17354F]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#17354F]/70 via-[#17354F]/45 to-[#0F1C28]/92" />

        <div className="relative mx-auto flex min-h-[200px] max-w-[1440px] flex-col px-5 pb-10 pt-6 sm:min-h-[240px] sm:px-8 sm:pb-12 sm:pt-8 lg:min-h-[260px] lg:px-10">
          <Link
            href={`/play/venues/${slugOrId}?date=${encodeURIComponent(date)}`}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white bg-transparent px-3.5 py-2 text-base font-bold !text-white transition hover:bg-white/15 dark:!text-white"
          >
            <ChevronLeft size={20} className="!text-white dark:!text-white" />
            <span className="!text-white dark:!text-white">{venue?.name ?? "Venue"}</span>
          </Link>

          <div className="mt-auto pt-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Pick a slot
            </h1>
            <p className="mt-2 text-base font-medium text-white/80">
              Choose a date, session length, then a time
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 pt-8 sm:px-8 sm:pt-10 lg:px-10">
      {error ? (
        <div className="rounded-2xl bg-amber-50 px-5 py-4 text-base font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          {error}
        </div>
      ) : null}
      {day?.closedNote ? (
        <div className={cn("rounded-2xl bg-amber-50 px-5 py-4 text-base font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100", error && "mt-4")}>
          {day.closedNote}
        </div>
      ) : null}

      {/* 1. Date — full-width web grid */}
      <section className={cn((error || day?.closedNote) && "mt-10", !(error || day?.closedNote) && "mt-2")}>
        <h2 className="text-lg font-extrabold tracking-tight text-[#17354F] dark:text-white">
          Date
        </h2>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-2.5">
          {horizon.map((iso) => {
            const on = iso === date;
            const weekend = isWeekendIso(iso);
            return (
              <button
                key={iso}
                type="button"
                title={iso}
                onClick={() => setDate(iso)}
                className={cn(
                  "flex min-h-[88px] flex-col items-center justify-center rounded-xl border px-1.5 py-3 transition",
                  on
                    ? "border-[#65AA2B] bg-[#17354F] text-white shadow-[0_8px_18px_rgba(23,53,79,0.16)] dark:bg-[#0F1C28]"
                    : "border-black/[0.06] bg-white text-[#17354F] hover:border-[#65AA2B]/50 dark:border-white/10 dark:bg-[#17354F] dark:text-white",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-extrabold uppercase tracking-wide",
                    on
                      ? "text-white/80"
                      : weekend
                        ? "text-[#C4473A]"
                        : "text-neutral-400 dark:text-white/45",
                  )}
                >
                  {weekdayShortFromIso(iso)}
                </span>
                <span className="mt-0.5 text-2xl font-extrabold leading-none">
                  {dayNumFromIso(iso)}
                </span>
                <span
                  className={cn(
                    "mt-1 text-[11px] font-bold uppercase",
                    on ? "text-white/75" : "text-neutral-400 dark:text-white/40",
                  )}
                >
                  {iso === today ? "Today" : monthShortFromIso(iso)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Court — only when more than one */}
      {courts.length > 1 ? (
        <section className="mt-12">
          <h2 className="text-lg font-extrabold tracking-tight text-[#17354F] dark:text-white">
            Court
          </h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {courts.map((c) => {
              const on = c.courtId === court?.courtId;
              return (
                <button
                  key={c.courtId}
                  type="button"
                  onClick={() => {
                    setCourtId(c.courtId!);
                    setDuration(c.defaultDuration ?? c.durations?.[0] ?? 60);
                    setSelected(null);
                  }}
                  className={cn(
                    "min-h-11 rounded-xl border px-5 py-2.5 text-sm font-extrabold transition",
                    on
                      ? "border-[#65AA2B] bg-[#17354F] text-white"
                      : "border-black/[0.06] bg-neutral-50 text-[#17354F] hover:border-[#65AA2B]/40 dark:border-white/10 dark:bg-white/5 dark:text-white",
                  )}
                >
                  {courtLabel(c)}
                  {c.sport ? (
                    <span
                      className={cn(
                        "ml-2 text-sm font-semibold",
                        on ? "text-white/70" : "text-neutral-500 dark:text-white/50",
                      )}
                    >
                      · {sportLabel(c.sport)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 2. Length */}
      {court ? (
        <section className="mt-12">
          <h2 className="text-lg font-extrabold tracking-tight text-[#17354F] dark:text-white">
            Length
          </h2>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {(court.durations?.length ? court.durations : [activeDuration]).map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  setDuration(mins);
                  setSelected(null);
                }}
                className={cn(
                  "min-h-11 min-w-[100px] rounded-xl border px-6 py-2.5 text-sm font-extrabold transition",
                  mins === activeDuration
                    ? "border-[#65AA2B] bg-[#17354F] text-white"
                    : "border-black/[0.06] bg-neutral-50 text-[#17354F] hover:border-[#65AA2B]/40 dark:border-white/10 dark:bg-white/5 dark:text-white",
                )}
              >
                {mins} min
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* 3. Slots */}
      {court ? (
        <section ref={timeSectionRef} className="mt-12 scroll-mt-24">
          <h2 className="text-lg font-extrabold tracking-tight text-[#17354F] dark:text-white">
            Time
          </h2>
          {loading ? (
            <div className="mt-2">
              <BrandLoader label="Loading slots" variant="inline" />
            </div>
          ) : slots.length === 0 ? (
            <p className="mt-4 text-base font-semibold text-neutral-500 dark:text-white/60">
              {court.closedNote || "No slots for this length."}
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
              {slots.map((slot) => {
                const open = slot.state === "AVAILABLE";
                const booked = slot.state === "BOOKED" || slot.state === "BLOCKED";
                const cutoff = slot.state === "CUTOFF";
                // App: olive fill when AVAILABLE + dealId (same as mobile _SlotCell)
                const dealFill = open && Boolean(slot.dealId);
                const isSelected =
                  selected?.slot.startAt === slot.startAt &&
                  selected?.court.courtId === court.courtId;
                const hm = hmFromIso(slot.startAt);
                const showStrike =
                  dealFill &&
                  slot.listPrice != null &&
                  slot.listPrice.paisa !== slot.price?.paisa;
                return (
                  <button
                    key={`${slot.startAt}-${slot.durationMinutes}`}
                    type="button"
                    disabled={!open}
                    onClick={() => setSelected({ court, slot })}
                    className={cn(
                      "flex min-h-[96px] flex-col items-center justify-center rounded-[14px] border px-1.5 py-2.5 text-center transition",
                      cutoff && "opacity-45",
                      !open && !dealFill && "cursor-default border-transparent bg-[#EEF2F6]",
                      open &&
                        !dealFill &&
                        "border-[#D5E0EA] bg-white shadow-[0_4px_8px_rgba(23,53,79,0.07)] hover:border-[#65AA2B] dark:border-white/25 dark:bg-[#17354F]",
                      // Mobile Brand.oliveGradient: limeDeep → limeBright
                      dealFill &&
                        "border-transparent bg-gradient-to-br from-[#4F8F38] to-[#66AB27] shadow-[0_4px_12px_rgba(23,53,79,0.18)]",
                      // Selection ring — does not steal the deal olive look
                      isSelected &&
                        !dealFill &&
                        "border-[#65AA2B] ring-2 ring-[#65AA2B]/35",
                      isSelected && dealFill && "ring-2 ring-white/50",
                    )}
                  >
                    {/* Dual clock like DualClockText.fromInstant */}
                    <span
                      className={cn(
                        "text-[13px] font-extrabold leading-tight",
                        dealFill
                          ? "text-white"
                          : open
                            ? "text-[#17354F] dark:text-white"
                            : "text-[#5C6E80]",
                        booked && "line-through decoration-[#5C6E80]",
                      )}
                    >
                      {hm ? formatHmDisplay(hm) : formatTime(slot.startAt)}
                    </span>
                    {hm ? (
                      <span
                        className={cn(
                          "text-[10px] font-bold leading-tight",
                          dealFill ? "text-white/70" : "text-[#5C6E80] dark:text-white/45",
                        )}
                      >
                        {hm}
                      </span>
                    ) : null}

                    {dealFill ? (
                      <span className="mt-0.5 text-[9px] font-extrabold tracking-wide text-white">
                        Deal
                      </span>
                    ) : null}

                    <span
                      className={cn(
                        "mt-1 text-[11px] font-extrabold",
                        dealFill
                          ? "text-white/95"
                          : open
                            ? "text-[#4F8F38] dark:text-[#D4E22A]"
                            : "text-[#5C6E80]",
                      )}
                    >
                      {open ? moneyDisplay(slot.price) : slotPlayerLabel(slot.state)}
                    </span>

                    {showStrike ? (
                      <span className="text-[9px] font-semibold text-white/60 line-through">
                        {moneyDisplay(slot.listPrice)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
      </div>

      {/* Sticky selection bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-[#0F1C28]/95">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-10">
          <div className="min-w-0">
            {selected ? (
              <div>
                <p className="truncate text-base font-extrabold text-[#17354F] dark:text-white">
                  {courtLabel(selected.court)} · {formatTime(selected.slot.startAt)} ·{" "}
                  {activeDuration} min
                </p>
                <div className="mt-1 flex items-baseline gap-2.5">
                  {selected.slot.dealId &&
                  selected.slot.listPrice &&
                  selected.slot.listPrice.paisa !== selected.slot.price?.paisa ? (
                    <span className="text-sm font-semibold text-neutral-400 line-through">
                      {moneyDisplay(selected.slot.listPrice)}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "text-xl font-extrabold",
                      selected.slot.dealId
                        ? "text-[#4F8F38] dark:text-[#D4E22A]"
                        : "text-[#17354F] dark:text-white",
                    )}
                  >
                    {moneyDisplay(selected.slot.price)}
                  </span>
                  {selected.slot.dealId ? (
                    <span className="inline-flex items-center gap-1 text-sm font-extrabold text-[#4F8F38] dark:text-[#D4E22A]">
                      <Tag size={14} />
                      Deal
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-base font-semibold text-neutral-400 dark:text-white/40">
                Select a time to continue
              </p>
            )}
          </div>
          <Button
            type="button"
            disabled={!selected}
            className="h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#4F8F38] to-[#66AB27] px-10 text-base font-bold text-white hover:from-[#458032] hover:to-[#5a9826] disabled:opacity-40 sm:min-w-[220px]"
            onClick={openConfirm}
          >
            Continue
          </Button>
        </div>
      </div>

      {confirmOpen && selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1C28]/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-booking-title"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_24px_60px_rgba(23,53,79,0.28)] dark:border-white/10 dark:bg-[#17354F]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="confirm-booking-title"
              className="text-xl font-extrabold tracking-tight text-[#17354F] dark:text-white"
            >
              Confirm this booking?
            </h2>
            <p className="mt-1.5 text-sm font-medium text-neutral-500 dark:text-white/55">
              You&apos;ll choose how to pay on the next screen.
            </p>

            <div className="mt-5 rounded-2xl bg-neutral-50 p-4 dark:bg-white/5">
              <p className="text-base font-extrabold text-[#17354F] dark:text-white">
                {venue?.name ?? "Venue"}
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-600 dark:text-white/65">
                {courtLabel(selected.court)} · {formatTime(selected.slot.startAt)} ·{" "}
                {activeDuration} min
              </p>
              <p className="mt-0.5 text-sm font-medium text-neutral-500 dark:text-white/50">
                {weekdayShortFromIso(date)} {dayNumFromIso(date)} {monthShortFromIso(date)}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                {selected.slot.dealId &&
                selected.slot.listPrice &&
                selected.slot.listPrice.paisa !== selected.slot.price?.paisa ? (
                  <span className="text-sm font-semibold text-neutral-400 line-through">
                    {moneyDisplay(selected.slot.listPrice)}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "text-xl font-extrabold",
                    selected.slot.dealId
                      ? "text-[#4F8F38] dark:text-[#D4E22A]"
                      : "text-[#17354F] dark:text-white",
                  )}
                >
                  {moneyDisplay(selected.slot.price)}
                </span>
                {selected.slot.dealId ? (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#4F8F38] dark:text-[#D4E22A]">
                    <Tag size={12} />
                    Deal
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl sm:min-w-[120px]"
                disabled={confirmBusy}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={confirmBusy}
                className="h-12 rounded-xl bg-gradient-to-br from-[#4F8F38] to-[#66AB27] text-white hover:from-[#458032] hover:to-[#5a9826] sm:min-w-[180px]"
                onClick={() => {
                  void goToPayment();
                }}
              >
                {confirmBusy ? "Checking…" : "Yes, continue"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
