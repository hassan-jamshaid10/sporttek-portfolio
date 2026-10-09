"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  BellOff,
  ChevronLeft,
  MapPin,
  Navigation,
  Phone,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { VenueFavouriteButton } from "@/components/play/venue-favourite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch, backendApi, publicApi } from "@/lib/api";
import { venueCoverSrc } from "@/lib/demo-cover";
import {
  addDaysIso,
  dayNumFromIso,
  formatHmDisplay,
  formatVerifiedDate,
  isWeekendIso,
  karachiDateInput,
  moneyDisplay,
  monthShortFromIso,
  weekdayShortFromIso,
} from "@/lib/format";
import { amenityLabel, sportLabel, surfaceLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { VenueDetail, VenueDetailCourt } from "@/lib/types";

const QUICK_TIMES = ["08:00", "12:00", "17:00", "20:00"] as const;

export function VenueDetailDesk({ slugOrId }: { slugOrId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [playDate, setPlayDate] = useState(
    () => search.get("date")?.trim() || karachiDateInput(),
  );
  const [playTime, setPlayTime] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [muteBusy, setMuteBusy] = useState(false);

  const today = useMemo(() => karachiDateInput(), []);
  const horizon = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDaysIso(today, i)),
    [today],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const body = await apiFetch<VenueDetail>(publicApi(`api/v1/venues/${slugOrId}`));
        if (cancelled) return;
        setVenue(body);
        setPhotoIndex(0);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load venue.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  const photos = useMemo(() => {
    if (!venue) return [] as string[];
    const urls = (venue.photos ?? [])
      .map((p) => p.url?.trim())
      .filter((u): u is string => Boolean(u));
    if (urls.length) return urls;
    if (venue.coverPhotoUrl?.trim()) return [venue.coverPhotoUrl.trim()];
    return [
      venueCoverSrc(
        null,
        (venue.sports ?? venue.courts?.map((c) => c.sport).filter(Boolean)) as string[],
        venue.name,
      ),
    ];
  }, [venue]);

  function openSlots(date = playDate, time = playTime) {
    const q = new URLSearchParams({ date });
    if (time) q.set("start", time);
    router.push(`/play/venues/${slugOrId}/slots?${q.toString()}`);
  }

  function selectDate(next: string) {
    setPlayDate(next);
    // Date chosen on detail → open slot picker for that day (same as app intent).
    openSlots(next, playTime);
  }

  function directions() {
    if (venue?.latitude == null || venue?.longitude == null) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function toggleMute() {
    if (!venue?.id) return;
    setMuteBusy(true);
    try {
      await apiFetch(backendApi(`api/v1/venues/${venue.id}/mute`), {
        method: muted ? "DELETE" : "POST",
      });
      setMuted((v) => !v);
    } catch {
      router.push(`/play/login?next=${encodeURIComponent(`/play/venues/${slugOrId}`)}`);
    } finally {
      setMuteBusy(false);
    }
  }

  if (loading) {
    return <BrandLoader label="Loading venue" variant="inline" />;
  }

  if (error || !venue) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <p className="font-extrabold text-[#17354F] dark:text-white">{error ?? "Venue not found"}</p>
        <Button asChild variant="outline">
          <Link href="/play">Back to venues</Link>
        </Button>
      </div>
    );
  }

  const place = [venue.area, venue.city].filter(Boolean).join(", ");
  const verified = formatVerifiedDate(venue.pricesVerifiedAt);
  const isCustomTime =
    playTime != null && !(QUICK_TIMES as readonly string[]).includes(playTime);
  const sports = [
    ...new Set(
      (venue.sports?.length
        ? venue.sports
        : (venue.courts ?? []).map((c) => c.sport).filter(Boolean)) as string[],
    ),
  ];

  const bookingCard = (
    <BookingPanel
      horizon={horizon}
      today={today}
      playDate={playDate}
      playTime={playTime}
      customOpen={customOpen}
      isCustomTime={isCustomTime}
      fromPrice={venue.fromPrice ?? venue.startingPrice}
      phoneE164={venue.phoneE164}
      canDirections={venue.latitude != null && venue.longitude != null}
      onDate={selectDate}
      onTime={(t) => {
        setPlayTime(t);
        setCustomOpen(false);
      }}
      onToggleCustom={() => setCustomOpen((v) => !v)}
      onCustomTime={(v) => {
        if (v) setPlayTime(v);
      }}
      onSlots={() => openSlots()}
      onDirections={directions}
    />
  );

  return (
    <div>
      {/* Photo background hero */}
      <section className="relative isolate overflow-hidden bg-[#17354F]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[photoIndex]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#17354F]/75 via-[#17354F]/35 to-[#0F1C28]/92" />

        <div className="relative mx-auto flex min-h-[300px] max-w-[1440px] flex-col px-5 pb-10 pt-5 sm:min-h-[340px] sm:px-8 sm:pb-12 lg:min-h-[360px] lg:px-10 lg:pb-14">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/play"
              className="inline-flex items-center gap-1 rounded-full border border-white bg-transparent px-3 py-2 text-sm font-bold !text-white transition hover:bg-white/15 dark:!text-white"
            >
              <ChevronLeft size={16} className="!text-white dark:!text-white" />
              <span className="!text-white dark:!text-white">All venues</span>
            </Link>
            {venue.id ? <VenueFavouriteButton venueId={venue.id} /> : null}
          </div>

          {/* Leave room on the right for the floating book card on desktop */}
          <div className="mt-auto max-w-2xl space-y-2.5 pt-16 lg:pr-8 xl:max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {venue.name}
            </h1>
            {place || venue.addressLine ? (
              <p className="flex items-start gap-1.5 text-sm font-medium text-white/85">
                <MapPin size={15} className="mt-0.5 shrink-0 text-white" />
                <span>{[venue.addressLine, place].filter(Boolean).join(" · ")}</span>
              </p>
            ) : null}
            {(sports.length > 0 || (venue.amenities?.length ?? 0) > 0) ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {sports.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg bg-[#65AA2B] px-2.5 py-1 text-[11px] font-bold text-white"
                  >
                    {sportLabel(s)}
                  </span>
                ))}
                {(venue.amenities ?? []).map((a) => (
                  <span
                    key={a}
                    className="rounded-lg border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm"
                  >
                    {amenityLabel(a)}
                  </span>
                ))}
              </div>
            ) : null}
            {photos.length > 1 ? (
              <div className="flex gap-2 pt-2">
                {photos.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setPhotoIndex(i)}
                    className={cn(
                      "relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border-2 transition",
                      i === photoIndex
                        ? "border-[#65AA2B]"
                        : "border-white/25 opacity-80 hover:opacity-100",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
            {(venue.fromPrice ?? venue.startingPrice) ? (
              <p className="pt-1 text-sm font-bold text-white lg:hidden">
                From{" "}
                <span className="text-lg font-extrabold">
                  {moneyDisplay(venue.fromPrice ?? venue.startingPrice)}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* White body — floating book card straddles photo + white */}
      <div className="relative bg-white dark:bg-[#0F1C28]">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 pb-10 pt-0 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-10 lg:pb-12 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0 space-y-7 pt-7 lg:pt-8">
            {venue.description ? (
              <p className="max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-white/70">
                {venue.description}
              </p>
            ) : null}

            <div className="lg:hidden">{bookingCard}</div>

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-[#17354F] dark:text-white">
                  Courts
                </h2>
                <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-white/60">
                  {(venue.courts ?? []).length} court{(venue.courts ?? []).length === 1 ? "" : "s"} at
                  this venue
                </p>
              </div>
              <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
                {(venue.courts ?? []).map((court) => (
                  <CourtCard key={court.id} court={court} />
                ))}
              </div>
              {(venue.courts ?? []).length === 0 ? (
                <p className="text-sm font-medium text-neutral-500 dark:text-white/60">
                  No courts listed yet.
                </p>
              ) : null}
            </section>

            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
              {venue.latitude != null && venue.longitude != null ? (
                <button
                  type="button"
                  onClick={directions}
                  className="flex h-full min-h-[240px] flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white text-left shadow-[0_8px_24px_rgba(23,53,79,0.05)] transition hover:shadow-[0_12px_28px_rgba(23,53,79,0.1)] dark:border-white/10 dark:bg-[#17354F]"
                >
                  <div className="flex items-center justify-between px-4 pt-3.5">
                    <h2 className="text-base font-extrabold text-[#17354F] dark:text-white">Location</h2>
                    <span className="text-xs font-extrabold text-[#4F8F38] dark:text-[#D4E22A]">
                      Directions
                    </span>
                  </div>
                  <div className="relative mx-4 mt-2.5 min-h-0 flex-1 overflow-hidden rounded-xl bg-neutral-100 dark:bg-white/5">
                    <iframe
                      title="Venue map"
                      className="pointer-events-none absolute inset-0 h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${venue.longitude - 0.01}%2C${venue.latitude - 0.008}%2C${venue.longitude + 0.01}%2C${venue.latitude + 0.008}&layer=mapnik&marker=${venue.latitude}%2C${venue.longitude}`}
                    />
                  </div>
                  <div className="px-4 py-3">
                    <span className="line-clamp-1 text-sm font-bold text-neutral-500 dark:text-white/60">
                      {place || "Open in Maps"}
                    </span>
                  </div>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              <div className="flex h-full min-h-[240px] flex-col rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/10 dark:bg-[#17354F]">
                <h2 className="text-base font-extrabold text-[#17354F] dark:text-white">Booking notes</h2>
                <div className="mt-2.5 flex min-h-0 flex-1 flex-col rounded-xl bg-neutral-50 p-4 dark:bg-white/5">
                  {verified ? (
                    <p className="text-xs font-semibold text-neutral-500 dark:text-white/55">
                      Prices verified on {verified}
                    </p>
                  ) : null}
                  <p
                    className={cn(
                      "flex-1 text-sm leading-relaxed text-neutral-600 dark:text-white/70",
                      verified && "mt-2",
                    )}
                  >
                    {venue.cancellationPolicy || "No cancellation notes published."}
                  </p>
                  <button
                    type="button"
                    disabled={muteBusy}
                    onClick={() => void toggleMute()}
                    className="mt-4 inline-flex items-center gap-2 self-start text-sm font-bold text-[#17354F] hover:text-[#4F8F38] disabled:opacity-50 dark:text-white dark:hover:text-[#D4E22A]"
                  >
                    {muted ? <BellOff size={16} /> : <Bell size={16} />}
                    {muted ? "Unmute alerts" : "Mute alerts from this venue"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Floating card: half over photo, half over white; sticky on page scroll */}
          <aside className="relative z-20 -mt-36 hidden self-start lg:block xl:-mt-40">
            <div className="sticky top-24">{bookingCard}</div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function BookingPanel({
  horizon,
  today,
  playDate,
  playTime,
  customOpen,
  isCustomTime,
  fromPrice,
  phoneE164,
  canDirections,
  onDate,
  onTime,
  onToggleCustom,
  onCustomTime,
  onSlots,
  onDirections,
}: {
  horizon: string[];
  today: string;
  playDate: string;
  playTime: string | null;
  customOpen: boolean;
  isCustomTime: boolean;
  fromPrice?: { display?: string; paisa?: number };
  phoneE164?: string;
  canDirections: boolean;
  onDate: (iso: string) => void;
  onTime: (hm: string | null) => void;
  onToggleCustom: () => void;
  onCustomTime: (hm: string) => void;
  onSlots: () => void;
  onDirections: () => void;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_20px_50px_rgba(23,53,79,0.18)] dark:border-white/10 dark:bg-[#17354F] dark:shadow-black/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-[#17354F] dark:text-white">
            Book a court
          </h2>
          <p className="mt-0.5 text-sm font-medium text-neutral-500 dark:text-white/55">
            Pick a day to open available slots
          </p>
        </div>
        {fromPrice ? (
          <Badge className="shrink-0 rounded-lg">{moneyDisplay(fromPrice)}</Badge>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-neutral-500 dark:text-white/50">
          Date
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {horizon.map((iso) => {
            const selected = iso === playDate;
            const weekend = isWeekendIso(iso);
            return (
              <button
                key={iso}
                type="button"
                title={iso}
                onClick={() => onDate(iso)}
                className={cn(
                  "flex flex-col items-center rounded-xl border px-0.5 py-2 transition",
                  selected
                    ? "border-[#65AA2B] bg-[#17354F] text-white dark:bg-[#0F1C28]"
                    : "border-black/[0.05] bg-neutral-50 text-[#17354F] hover:border-[#65AA2B]/40 dark:border-white/10 dark:bg-white/5 dark:text-white",
                )}
              >
                <span
                  className={cn(
                    "text-[9px] font-extrabold uppercase",
                    selected
                      ? "text-white/80"
                      : weekend
                        ? "text-[#C4473A]"
                        : "text-neutral-400 dark:text-white/45",
                  )}
                >
                  {weekdayShortFromIso(iso).slice(0, 2)}
                </span>
                <span className="text-sm font-extrabold leading-tight">{dayNumFromIso(iso)}</span>
                <span
                  className={cn(
                    "text-[8px] font-bold uppercase",
                    selected ? "text-white/75" : "text-neutral-400 dark:text-white/40",
                  )}
                >
                  {iso === today ? "Now" : monthShortFromIso(iso).slice(0, 3)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-neutral-500 dark:text-white/50">
          Preferred time
        </p>
        <div className="grid grid-cols-3 gap-2">
          <TimeChip label="Any time" selected={playTime == null} onClick={() => onTime(null)} />
          {QUICK_TIMES.map((t) => (
            <TimeChip
              key={t}
              label={formatHmDisplay(t)}
              selected={playTime === t}
              onClick={() => onTime(t)}
            />
          ))}
          <TimeChip
            label={isCustomTime && playTime ? formatHmDisplay(playTime) : "Custom"}
            selected={isCustomTime}
            custom
            onClick={onToggleCustom}
          />
        </div>
        {customOpen ? (
          <input
            type="time"
            className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-neutral-50 px-3 text-sm font-semibold text-[#17354F] outline-none focus:border-[#65AA2B] dark:border-white/15 dark:bg-white/10 dark:text-white"
            value={playTime && isCustomTime ? playTime : ""}
            onChange={(e) => onCustomTime(e.target.value)}
          />
        ) : null}
      </div>

      <Button
        type="button"
        className="mt-5 h-12 w-full rounded-xl bg-gradient-to-br from-[#4F8F38] to-[#66AB27] text-[15px] font-bold text-white hover:from-[#458032] hover:to-[#5a9826]"
        onClick={onSlots}
      >
        See available slots
      </Button>

      {(phoneE164 || canDirections) && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {phoneE164 ? (
            <Button asChild variant="outline" className="rounded-xl">
              <a href={`tel:${phoneE164}`}>
                <Phone size={16} />
                Call
              </a>
            </Button>
          ) : (
            <span />
          )}
          {canDirections ? (
            <Button type="button" variant="outline" className="rounded-xl" onClick={onDirections}>
              <Navigation size={16} />
              Directions
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function TimeChip({
  label,
  selected,
  onClick,
  custom = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  custom?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 items-center justify-center rounded-xl border px-2 text-center text-[11px] font-extrabold transition",
        selected
          ? "border-[#65AA2B] bg-[#17354F] text-white dark:bg-[#0F1C28]"
          : custom
            ? "border-[#17354F]/35 bg-white text-[#17354F] dark:border-white/30 dark:bg-white/5 dark:text-white"
            : "border-black/[0.06] bg-neutral-50 text-[#17354F] dark:border-white/10 dark:bg-white/5 dark:text-white",
      )}
    >
      {label}
    </button>
  );
}

function CourtCard({ court }: { court: VenueDetailCourt }) {
  const meta = [sportLabel(court.sport), surfaceLabel(court.surface)].filter(Boolean).join(" · ");
  return (
    <div className="flex h-full min-h-[88px] items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/10 dark:bg-[#17354F]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E8F3DE] dark:bg-[#243B54]">
        {court.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={court.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Waves size={20} className="text-[#4F8F38] dark:text-[#D4E22A]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold text-[#17354F] dark:text-white">{court.name ?? "Court"}</p>
        {meta ? (
          <p className="truncate text-xs font-semibold text-neutral-500 dark:text-white/60">{meta}</p>
        ) : null}
      </div>
      {court.fromPrice ? (
        <div className="shrink-0 text-right">
          <p className="text-[9px] font-extrabold uppercase tracking-wide text-neutral-500 dark:text-white/50">
            From
          </p>
          <p className="text-sm font-extrabold text-[#4F8F38] dark:text-[#D4E22A]">
            {moneyDisplay(court.fromPrice)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
