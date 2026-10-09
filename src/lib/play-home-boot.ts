import { apiFetch, publicApi } from "@/lib/api";
import type {
  ExclusiveDeal,
  HeroBanner,
  VenueCard,
  VenueListResponse,
  VenueMapPin,
  VenueMapResponse,
} from "@/lib/types";

export type PlayHomeBoot = {
  venues: VenueCard[];
  priority: VenueCard[];
  banners: HeroBanner[];
  deals: ExclusiveDeal[];
  pins: VenueMapPin[];
  viewport: { lat: number; lon: number };
  areaOptions: string[];
  error: string | null;
};

let cache: PlayHomeBoot | null = null;
let inflight: Promise<PlayHomeBoot> | null = null;

const DEFAULT_VIEWPORT = { lat: 31.5204, lon: 74.3587 };

export function peekPlayHomeBoot(): PlayHomeBoot | null {
  return cache;
}

export function clearPlayHomeBoot() {
  cache = null;
  inflight = null;
}

/** Prefetch the /play home catalog so the shell can dismiss with data ready. */
export async function ensurePlayHomeBoot(force = false): Promise<PlayHomeBoot> {
  if (!force && cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const [venueBody, mapBody, bannerBody, dealBody] = await Promise.all([
        apiFetch<VenueListResponse>(publicApi("api/v1/venues?size=40")),
        apiFetch<VenueMapResponse>(publicApi("api/v1/venues/map")).catch(
          (): VenueMapResponse => ({ items: [] }),
        ),
        apiFetch<{ items?: HeroBanner[] }>(publicApi("api/v1/hero-banners")).catch(() => ({
          items: [] as HeroBanner[],
        })),
        apiFetch<{ items?: ExclusiveDeal[] }>(publicApi("api/v1/deals/exclusive")).catch(() => ({
          items: [] as ExclusiveDeal[],
        })),
      ]);

      const items = venueBody.items ?? [];
      const mapPins = mapBody.items ?? [];
      const areas = new Set<string>();
      for (const v of items) {
        if (v.area?.trim()) areas.add(v.area.trim());
      }

      const boot: PlayHomeBoot = {
        venues: items,
        priority: venueBody.priorityVenues ?? items.filter((v) => v.priority),
        banners: (bannerBody.items ?? []).filter((b) => b.imageUrl),
        deals: dealBody.items ?? [],
        pins: mapPins.length
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
        viewport:
          venueBody.viewportLatitude != null && venueBody.viewportLongitude != null
            ? { lat: venueBody.viewportLatitude, lon: venueBody.viewportLongitude }
            : mapBody.viewportLatitude != null && mapBody.viewportLongitude != null
              ? { lat: mapBody.viewportLatitude, lon: mapBody.viewportLongitude }
              : DEFAULT_VIEWPORT,
        areaOptions: Array.from(areas).sort((a, b) => a.localeCompare(b)),
        error: null,
      };
      cache = boot;
      return boot;
    } catch (err) {
      const boot: PlayHomeBoot = {
        venues: [],
        priority: [],
        banners: [],
        deals: [],
        pins: [],
        viewport: DEFAULT_VIEWPORT,
        areaOptions: [],
        error: err instanceof Error ? err.message : "Could not load venues.",
      };
      cache = boot;
      return boot;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
