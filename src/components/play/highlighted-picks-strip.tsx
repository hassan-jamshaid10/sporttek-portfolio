"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Star, Tag } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { VenueFavouriteButton } from "@/components/play/venue-favourite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { venueCoverSrc } from "@/lib/demo-cover";
import { moneyDisplay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VenueCard } from "@/lib/types";

const CARD_GAP = 12;
const DRAG_THRESHOLD = 8;

export function HighlightedPicksStrip({
  venues,
  today,
}: {
  venues: VenueCard[];
  today: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const dragMoved = useRef(false);

  const syncArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const overflow = max > 4;
    setCanPrev(overflow && el.scrollLeft > 4);
    setCanNext(overflow && el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    syncArrows();
    el.addEventListener("scroll", syncArrows, { passive: true });
    const ro = new ResizeObserver(syncArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", syncArrows);
      ro.disconnect();
    };
  }, [venues, syncArrows]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-pick-card]");
    const step = (card?.offsetWidth ?? 200) + CARD_GAP;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let pointerId: number | null = null;

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      dragMoved.current = false;
      startX = e.clientX;
      startScroll = el!.scrollLeft;
      pointerId = e.pointerId;
      el!.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging || pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) dragMoved.current = true;
      el!.scrollLeft = startScroll - dx;
    }
    function onPointerUp(e: PointerEvent) {
      if (!dragging || pointerId !== e.pointerId) return;
      dragging = false;
      pointerId = null;
      try {
        el!.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [venues]);

  if (venues.length === 0) return null;

  const showArrows = canPrev || canNext;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="lime" className="gap-1 rounded-lg px-2 py-1">
            <Star size={12} fill="currentColor" />
            Highlighted
          </Badge>
          <p className="text-sm font-medium text-neutral-500 dark:text-white/60">
            Top picks for you
          </p>
        </div>
        {showArrows ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={!canPrev}
              aria-label="Previous picks"
              onClick={() => scrollByDir(-1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={!canNext}
              aria-label="Next picks"
              onClick={() => scrollByDir(1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {venues.map((venue) => (
          <PickCard
            key={venue.id}
            venue={venue}
            today={today}
            onNavigate={(e) => {
              if (dragMoved.current) {
                e.preventDefault();
                dragMoved.current = false;
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}

function PickCard({
  venue,
  today,
  onNavigate,
}: {
  venue: VenueCard;
  today: string;
  onNavigate: (e: MouseEvent) => void;
}) {
  const discount = venue.dealDiscountPercent;
  const hasDeal = discount != null && discount > 0;
  const promo = venue.dealPromoCode?.trim();
  const price = venue.fromPrice ?? venue.startingPrice;

  return (
    <Link
      data-pick-card
      href={`/play/venues/${venue.id}?date=${today}`}
      onClick={onNavigate}
      className="group w-[min(72vw,220px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-black/[0.04] bg-white shadow-[0_8px_24px_rgba(23,53,79,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(23,53,79,0.1)] dark:border-white/10 dark:bg-[#17354F] sm:w-[200px]"
    >
      <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={venueCoverSrc(venue.coverPhotoUrl, venue.sports, venue.name)}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/25" />

        {hasDeal ? (
          <div className="absolute left-1.5 top-1.5 z-[1] flex flex-col items-start gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-[#4F8F38] to-[#66AB27] px-1.5 py-1 text-[10px] font-black text-white shadow-[0_4px_12px_rgba(79,143,56,0.45)]">
              <Tag size={10} strokeWidth={2.6} />
              {discount}% OFF
            </span>
            {promo ? (
              <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white">
                {promo}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="absolute right-1.5 top-1.5 z-[1]">
          <VenueFavouriteButton venueId={venue.id!} compact />
        </div>

        {price ? (
          <div className="absolute bottom-1.5 right-1.5 z-[1] rounded-lg border border-[#65AA2B]/50 bg-white/95 px-2 py-1 shadow dark:bg-[#17354F]/95">
            <p
              className={cn(
                "text-[11px] font-black leading-none",
                hasDeal
                  ? "text-[#4F8F38] dark:text-[#D4E22A]"
                  : "text-[#17354F] dark:text-white",
              )}
            >
              {moneyDisplay(price)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="truncate text-[14px] font-extrabold tracking-tight text-[#17354F] dark:text-white">
          {venue.name}
        </h3>
        <p className="flex items-center gap-1 truncate text-xs font-medium text-neutral-500 dark:text-white/60">
          <MapPin size={12} className="shrink-0 text-[#65AA2B]" />
          {[venue.area, venue.city].filter(Boolean).join(" · ") || "Pakistan"}
        </p>
      </div>
    </Link>
  );
}
