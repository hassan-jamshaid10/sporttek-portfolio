"use client";

import Link from "next/link";
import { MapPin, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayUi } from "@/components/play/AppShell";
import { BrandLoader } from "@/components/play/brand-loader";
import { ExclusiveDealsStrip } from "@/components/play/exclusive-deals-strip";
import { HighlightedPicksStrip } from "@/components/play/highlighted-picks-strip";
import { VenueFavouriteButton } from "@/components/play/venue-favourite-button";
import { VenueMap } from "@/components/play/VenueMap";
import {
  VenueFilterBar,
  type VenueFilters,
} from "@/components/play/venue-filter-bar";
import { Badge } from "@/components/ui/badge";
import { apiFetch, publicApi } from "@/lib/api";
import { venueCoverSrc } from "@/lib/demo-cover";
import { karachiDateInput, moneyDisplay, moneyFromPaisa, wasPricePaisa } from "@/lib/format";
import { peekPlayHomeBoot } from "@/lib/play-home-boot";
import { cn } from "@/lib/utils";
import type {
  ExclusiveDeal,
  HeroBanner,
  VenueCard,
  VenueListResponse,
  VenueMapPin,
  VenueMapResponse,
} from "@/lib/types";

const DEFAULT_FILTERS: VenueFilters = {
  query: "",
  sports: [],
  areas: [],
  availableTonight: false,
  sort: "RECOMMENDED",
};

function isDefaultBrowse(filters: VenueFilters, query: string) {
  return (
    !query.trim() &&
    filters.sports.length === 0 &&
    filters.areas.length === 0 &&
    !filters.availableTonight &&
    filters.sort === "RECOMMENDED"
  );
}

function buildBrowseParams(
  filters: VenueFilters,
  query: string,
  opts?: { size?: number; includeSort?: boolean },
) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  for (const sport of filters.sports) params.append("sport", sport);
  for (const area of filters.areas) params.append("area", area);
  if (filters.availableTonight) params.set("availableTonight", "true");
  if (opts?.includeSort !== false && filters.sort !== "RECOMMENDED") {
    params.set("sort", filters.sort);
  }
  if (opts?.size != null) params.set("size", String(opts.size));
  return params;
}

function HomeBody() {
  const { showMap } = usePlayUi();
  const boot = peekPlayHomeBoot();
  const [venues, setVenues] = useState<VenueCard[]>(() => boot?.venues ?? []);
  const [priority, setPriority] = useState<VenueCard[]>(() => boot?.priority ?? []);
  const [banners, setBanners] = useState<HeroBanner[]>(() => boot?.banners ?? []);
  const [deals, setDeals] = useState<ExclusiveDeal[]>(() => boot?.deals ?? []);
  const [pins, setPins] = useState<VenueMapPin[]>(() => boot?.pins ?? []);
  const [viewport, setViewport] = useState(
    () => boot?.viewport ?? { lat: 31.5204, lon: 74.3587 },
  );
  const [areaOptions, setAreaOptions] = useState<string[]>(() => boot?.areaOptions ?? []);
  const [error, setError] = useState<string | null>(() => boot?.error ?? null);
  const [loading, setLoading] = useState(() => !boot);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [filters, setFilters] = useState<VenueFilters>(DEFAULT_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search so typing does not hammer the API.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(filters.query), 320);
    return () => window.clearTimeout(id);
  }, [filters.query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Shell already loaded the default catalog — skip a second round-trip.
      if (isDefaultBrowse(filters, debouncedQuery) && peekPlayHomeBoot()) {
        const cached = peekPlayHomeBoot()!;
        if (!cancelled) {
          setVenues(cached.venues);
          setPriority(cached.priority);
          setBanners(cached.banners);
          setDeals(cached.deals);
          setPins(cached.pins);
          setViewport(cached.viewport);
          setAreaOptions(cached.areaOptions);
          setError(cached.error);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const listParams = buildBrowseParams(filters, debouncedQuery, { size: 40 });
        const mapParams = buildBrowseParams(filters, debouncedQuery, { includeSort: false });
        const listQs = listParams.toString();
        const mapQs = mapParams.toString();

        const [venueBody, mapBody] = await Promise.all([
          apiFetch<VenueListResponse>(
            publicApi(`api/v1/venues${listQs ? `?${listQs}` : ""}`),
          ),
          apiFetch<VenueMapResponse>(
            publicApi(`api/v1/venues/map${mapQs ? `?${mapQs}` : ""}`),
          ).catch((): VenueMapResponse => ({ items: [] })),
        ]);
        if (cancelled) return;

        const items = venueBody.items ?? [];
        setVenues(items);
        setPriority(venueBody.priorityVenues ?? items.filter((v) => v.priority));
        setAreaOptions((prev) => {
          const next = new Set(prev);
          for (const v of items) {
            if (v.area?.trim()) next.add(v.area.trim());
          }
          return Array.from(next).sort((a, b) => a.localeCompare(b));
        });

        const mapPins = mapBody.items ?? [];
        setPins(
          mapPins.length
            ? mapPins
            : items
                .filter((v) => v.latitude != null && v.longitude != null)
                .map((v) => ({
                  id: v.id,
                  slug: v.slug,
                  name: v.name,
                  latitude: v.latitude,
                  longitude: v.longitude,
                })),
        );
        if (venueBody.viewportLatitude != null && venueBody.viewportLongitude != null) {
          setViewport({ lat: venueBody.viewportLatitude, lon: venueBody.viewportLongitude });
        } else if (mapBody.viewportLatitude != null && mapBody.viewportLongitude != null) {
          setViewport({ lat: mapBody.viewportLatitude, lon: mapBody.viewportLongitude });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load venues.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, filters.sports, filters.areas, filters.availableTonight, filters.sort]);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = window.setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [banners.length]);

  const today = karachiDateInput();
  const searching = debouncedQuery.trim().length > 0 || filters.query.trim().length > 0;
  const highlighted = searching || filters.sports.length || filters.areas.length ? [] : priority;
  const showPromoRow =
    !showMap &&
    !searching &&
    filters.sports.length === 0 &&
    filters.areas.length === 0 &&
    (banners.length > 0 || deals.length > 0);

  return (
    <div className={cn("space-y-6", showMap && "space-y-4")}>
      <VenueFilterBar value={filters} areaOptions={areaOptions} onChange={setFilters} />

      {error ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          {error}
        </div>
      ) : null}

      {showMap ? (
        <VenueMap
          pins={pins}
          viewportLat={viewport.lat}
          viewportLon={viewport.lon}
          className="h-[calc(100dvh-10.5rem)] overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/10"
        />
      ) : null}

      {!showMap ? (
      <>

      {/* Banner + deals share row-1 (equal height / aligned bottoms); dots under banner only */}
      {showPromoRow ? (
        <section className="grid items-stretch gap-x-4 gap-y-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto]">
          {banners.length > 0 ? (
            <div className="relative w-full self-stretch overflow-hidden rounded-2xl bg-[#17354F] shadow-[0_10px_28px_rgba(23,53,79,0.1)] [aspect-ratio:22/9] lg:col-start-1 lg:row-start-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banners[bannerIndex]?.imageUrl}
                alt={banners[bannerIndex]?.title ?? "SportTek"}
                className="h-full w-full object-contain object-center"
              />
            </div>
          ) : (
            <div className="hidden lg:col-start-1 lg:row-start-1 lg:block" />
          )}

          {deals.length > 0 ? (
            <div className="flex min-h-[152px] min-w-0 self-stretch lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:h-auto">
              <ExclusiveDealsStrip deals={deals} className="h-full w-full" />
            </div>
          ) : null}

          {banners.length > 1 ? (
            <div className="flex justify-center gap-1.5 lg:col-start-1 lg:row-start-2 lg:justify-start">
              {banners.map((b, i) => (
                <button
                  key={b.id ?? i}
                  type="button"
                  aria-label={`Banner ${i + 1}`}
                  onClick={() => setBannerIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === bannerIndex ? "w-5 bg-[#65AA2B]" : "w-1.5 bg-neutral-300 dark:bg-white/25",
                  )}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {highlighted.length > 0 ? (
        <HighlightedPicksStrip venues={highlighted} today={today} />
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#17354F] dark:text-white">
            Featured arenas
          </h2>
          <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-white/60">
            {loading ? "Loading…" : `Book courts near you · ${venues.length} venues`}
          </p>
        </div>

        {loading && venues.length === 0 ? (
          <BrandLoader label="Finding courts" />
        ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {venues.map((venue) => (
            <VenueTile key={venue.id} venue={venue} today={today} />
          ))}
        </div>
        )}

        {!loading && venues.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.05] bg-neutral-50 px-6 py-12 text-center dark:border-white/10 dark:bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sporttek-avatar-Photoroom.png"
              alt=""
              width={72}
              height={72}
              className="mx-auto"
            />
            <p className="mt-3 font-extrabold text-[#17354F] dark:text-white">No venues match</p>
            <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-white/60">
              Try another filter or clear search.
            </p>
          </div>
        ) : null}
      </section>
      </>
      ) : null}
    </div>
  );
}

function VenueTile({
  venue,
  today,
  compact = false,
}: {
  venue: VenueCard;
  today: string;
  compact?: boolean;
}) {
  const discount = venue.dealDiscountPercent;
  const hasDeal = discount != null && discount > 0;
  const promo = venue.dealPromoCode?.trim();
  const price = venue.fromPrice ?? venue.startingPrice;
  const was =
    !compact && hasDeal && price?.paisa != null
      ? wasPricePaisa(price.paisa, discount)
      : null;

  return (
    <Link
      href={`/play/venues/${venue.id}?date=${today}`}
      className="group overflow-hidden rounded-2xl border border-black/[0.04] bg-white shadow-[0_8px_24px_rgba(23,53,79,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(23,53,79,0.1)] dark:border-white/10 dark:bg-[#17354F]"
    >
      <div className={cn("relative bg-neutral-100 dark:bg-white/5", compact ? "aspect-[4/3]" : "aspect-[16/11]")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={venueCoverSrc(venue.coverPhotoUrl, venue.sports, venue.name)}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/25" />

        {hasDeal ? (
          <div className={cn("absolute left-2 top-2 z-[1] flex flex-col items-start gap-1.5", compact ? "left-1.5 top-1.5" : null)}>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-[#4F8F38] to-[#66AB27] font-black text-white shadow-[0_4px_12px_rgba(79,143,56,0.45)]",
                compact ? "px-1.5 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]",
              )}
            >
              <Tag size={compact ? 10 : 12} strokeWidth={2.6} />
              {discount}% OFF
            </span>
            {promo ? (
              <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white">
                {promo}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className={cn("absolute right-2 top-2 z-[1]", compact ? "right-1.5 top-1.5" : null)}>
          <VenueFavouriteButton venueId={venue.id} compact={compact} />
        </div>

        {venue.priority && !compact ? (
          <Badge variant="lime" className="absolute bottom-2 left-2 z-[1] shadow-sm">
            Featured
          </Badge>
        ) : null}

        {compact && price ? (
          <div className="absolute bottom-1.5 right-1.5 z-[1] rounded-lg border border-[#65AA2B]/50 bg-white/95 px-2 py-1 shadow dark:bg-[#17354F]/95">
            <p className={cn("text-[11px] font-black leading-none", hasDeal ? "text-[#4F8F38] dark:text-[#D4E22A]" : "text-[#17354F] dark:text-white")}>
              {moneyDisplay(price)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="space-y-1.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-extrabold tracking-tight text-[#17354F] dark:text-white">
              {venue.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-medium text-neutral-500 dark:text-white/60">
              <MapPin size={12} className="shrink-0 text-[#65AA2B]" />
              {[venue.area, venue.city].filter(Boolean).join(" · ") || "Pakistan"}
            </p>
          </div>
          {!compact ? (
            <div className="shrink-0 text-right">
              {was != null ? (
                <p className="text-[10px] font-semibold text-neutral-400 line-through dark:text-white/40">
                  {moneyFromPaisa(was)}
                </p>
              ) : null}
              <Badge
                className={cn(
                  "shrink-0",
                  hasDeal ? "bg-[#65AA2B]/15 text-[#4F8F38] dark:bg-[#65AA2B]/25 dark:text-[#D4E22A]" : null,
                )}
              >
                {moneyDisplay(price)}
              </Badge>
            </div>
          ) : null}
        </div>
        {venue.sports?.length ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {venue.sports.slice(0, 3).map((sport) => (
              <span
                key={sport}
                className="rounded-full bg-[#65AA2B]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#4F8F38] dark:bg-[#65AA2B]/20 dark:text-[#D4E22A]"
              >
                {sport}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default function PlayHomePage() {
  return <HomeBody />;
}
