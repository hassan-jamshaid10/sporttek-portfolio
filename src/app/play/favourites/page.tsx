"use client";

import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { VenueFavouriteButton } from "@/components/play/venue-favourite-button";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch, backendApi } from "@/lib/api";
import { messageForCode } from "@/lib/auth-messages";
import { venueCoverSrc } from "@/lib/demo-cover";
import { sportLabel } from "@/lib/labels";

type FavouriteRow = {
  venueId?: string;
  name?: string;
  slug?: string;
  sport?: string;
  areaName?: string;
  photoUrl?: string;
};

export default function FavouritesPage() {
  const [venues, setVenues] = useState<FavouriteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const body = await apiFetch<{ items?: FavouriteRow[] }>(
          backendApi("api/v1/me/favourites"),
        );
        if (!cancelled) setVenues(body.items ?? []);
      } catch (err) {
        if (!cancelled) {
          const api = err as ApiError;
          setError(
            messageForCode(api.messageCode, api.message, api.fields) ||
              "Could not load favourites.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1100px] space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17354F] dark:text-white sm:text-4xl">
            My favourites
          </h1>
          <p className="mt-1.5 text-base font-medium text-neutral-500 dark:text-white/55">
            Venues you saved for quick booking.
          </p>
        </div>
        <Button asChild variant="outline" className="h-11 rounded-xl">
          <Link href="/play">Find more venues</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <BrandLoader label="Loading favourites" />
      ) : venues.length === 0 ? (
        <div className="rounded-3xl border border-black/[0.06] bg-white px-8 py-16 text-center shadow-[0_12px_32px_rgba(23,53,79,0.06)] dark:border-white/10 dark:bg-[#17354F]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F4DC] text-[#4F8F38] dark:bg-[#1E3A24] dark:text-[#D4E22A]">
            <Heart size={26} />
          </div>
          <p className="mt-4 text-xl font-extrabold text-[#17354F] dark:text-white">
            No saved venues yet
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-white/55">
            Tap the heart on a venue card to save it here.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href="/play">Browse venues</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {venues.map((venue) => {
            const id = venue.venueId ?? venue.slug ?? "";
            return (
              <Link
                key={id}
                href={`/play/venues/${id}`}
                className="group overflow-hidden rounded-3xl border border-black/[0.04] bg-white shadow-[0_8px_24px_rgba(23,53,79,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(23,53,79,0.1)] dark:border-white/10 dark:bg-[#17354F]"
              >
                <div className="relative aspect-[16/11] bg-neutral-100 dark:bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={venueCoverSrc(venue.photoUrl, venue.sport ? [venue.sport] : [], venue.name)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />
                  {venue.venueId ? (
                    <div className="absolute right-2 top-2 z-[1]">
                      <VenueFavouriteButton venueId={venue.venueId} compact />
                    </div>
                  ) : null}
                  {venue.sport ? (
                    <span className="absolute bottom-2 left-2 z-[1] rounded-lg bg-[#65AA2B] px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                      {sportLabel(venue.sport)}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-1 p-4">
                  <h2 className="truncate text-[15px] font-extrabold text-[#17354F] dark:text-white">
                    {venue.name ?? "Venue"}
                  </h2>
                  <p className="flex items-center gap-1 truncate text-xs font-medium text-neutral-500 dark:text-white/60">
                    <MapPin size={12} className="shrink-0 text-[#65AA2B]" />
                    {venue.areaName || "Pakistan"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
