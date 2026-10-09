"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { venueCoverSrc } from "@/lib/demo-cover";
import { cn } from "@/lib/utils";
import type { ExclusiveDeal } from "@/lib/types";

const CARD_GAP = 12;
const DRAG_THRESHOLD = 8;

export function ExclusiveDealsStrip({
  deals,
  className,
}: {
  deals: ExclusiveDeal[];
  className?: string;
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
  }, [deals, syncArrows]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-deal-card]");
    const step = (card?.offsetWidth ?? 168) + CARD_GAP;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  // Pointer swipe for mouse + touch; blocks click after a real drag
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
  }, [deals]);

  if (deals.length === 0) return null;

  const showArrows = canPrev || canNext;

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-base font-extrabold tracking-tight text-[#17354F] dark:text-white">
          Exclusive offers
        </h2>
        {showArrows ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={!canPrev}
              aria-label="Previous deals"
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
              aria-label="Next deals"
              onClick={() => scrollByDir(1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="flex min-h-0 flex-1 touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {deals.map((deal) => (
          <ExclusiveTile
            key={deal.dealId ?? deal.id}
            deal={deal}
            onNavigate={(e) => {
              if (dragMoved.current) {
                e.preventDefault();
                dragMoved.current = false;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ExclusiveTile({
  deal,
  onNavigate,
}: {
  deal: ExclusiveDeal;
  onNavigate: (e: MouseEvent) => void;
}) {
  const href = deal.venueId
    ? `/play/venues/${deal.venueId}`
    : deal.venueSlug
      ? `/play/venues/${deal.venueSlug}`
      : "/play";
  const cover = venueCoverSrc(
    deal.coverPhotoUrl ?? deal.coverImageUrl,
    [],
    deal.venueName ?? deal.title ?? "",
  );
  const code = deal.promoCode?.trim();

  return (
    <Link
      data-deal-card
      href={href}
      onClick={onNavigate}
      className="relative aspect-square h-full w-auto min-h-[136px] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#17354F] shadow-[0_8px_20px_rgba(23,53,79,0.12)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1C28]/cc via-[#0F1C28]/20 to-transparent" />
      {deal.discountPercent != null ? (
        <span className="absolute left-2 top-2 rounded-lg bg-gradient-to-br from-[#4F8F38] to-[#66AB27] px-2 py-1 text-[11px] font-black text-white shadow">
          {deal.discountPercent}% off
        </span>
      ) : null}
      <div className="absolute inset-x-2.5 bottom-2.5 space-y-1.5">
        <p className="truncate text-[13px] font-extrabold leading-tight text-white drop-shadow">
          {deal.venueName ?? deal.title ?? "Deal"}
        </p>
        {code ? (
          <button
            type="button"
            className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void navigator.clipboard.writeText(code);
            }}
          >
            <span className="truncate">{code}</span>
            <Copy size={12} aria-hidden />
          </button>
        ) : (
          <p className="text-[10.5px] font-semibold text-white/75">Open venue for details</p>
        )}
      </div>
    </Link>
  );
}
