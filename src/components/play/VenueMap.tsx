"use client";

import { useEffect, useRef } from "react";
import type { VenueMapPin } from "@/lib/types";
import { cn } from "@/lib/utils";

type LeafletMap = {
  setView: (latlng: [number, number], zoom: number) => LeafletMap;
  fitBounds: (bounds: [number, number][], opts: Record<string, unknown>) => void;
  remove: () => void;
  invalidateSize: () => void;
  eachLayer: (fn: (layer: LeafletLayer) => void) => void;
  removeLayer: (layer: LeafletLayer) => void;
};

type LeafletLayer = {
  options?: { sporttekPin?: boolean };
};

type LeafletMarker = LeafletLayer & {
  addTo: (m: LeafletMap) => LeafletMarker;
  bindPopup: (html: string) => LeafletMarker;
};

type LeafletNS = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, opts: Record<string, unknown>) => { addTo: (m: LeafletMap) => void };
  divIcon: (opts: Record<string, unknown>) => unknown;
  marker: (latlng: [number, number], opts: Record<string, unknown>) => LeafletMarker;
};

declare global {
  interface Window {
    L?: LeafletNS;
  }
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let leafletPromise: Promise<LeafletNS> | null = null;

function loadLeaflet(): Promise<LeafletNS> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = (async () => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      await new Promise<void>((resolve, reject) => {
        const el = document.createElement("script");
        el.src = LEAFLET_JS;
        el.async = true;
        el.onload = () => resolve();
        el.onerror = () => reject(new Error("Failed to load Leaflet"));
        document.body.appendChild(el);
      });
    }
    if (!window.L) throw new Error("Leaflet missing");
    return window.L;
  })();

  return leafletPromise;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pinKey(pin: VenueMapPin) {
  return `${pin.id ?? pin.slug ?? ""}:${pin.latitude},${pin.longitude}`;
}

export function VenueMap({
  pins,
  viewportLat = 31.5204,
  viewportLon = 74.3587,
  className,
}: {
  pins: VenueMapPin[];
  viewportLat?: number;
  viewportLon?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const readyRef = useRef(false);

  // Create map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, {
          zoomControl: true,
          preferCanvas: true,
        }).setView([viewportLat, viewportLon], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
          updateWhenIdle: true,
          keepBuffer: 2,
        }).addTo(map);
        mapRef.current = map;
        readyRef.current = true;
        // After layout (filter bar above), fix tile sizing.
        window.requestAnimationFrame(() => map.invalidateSize());
      } catch {
        /* map optional */
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      readyRef.current = false;
    };
    // viewport only seeds the first view — fitBounds handles later updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Diff markers when pins change — no full map rebuild.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await loadLeaflet().catch(() => null);
      const map = mapRef.current;
      if (cancelled || !L || !map) return;

      map.invalidateSize();

      const nextKeys = new Set<string>();
      const bounds: [number, number][] = [];
      const limeIcon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#65aa2b;border:2px solid #17354f;margin:10px auto 0;box-shadow:0 2px 8px rgba(23,53,79,.35)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      for (const pin of pins) {
        if (pin.latitude == null || pin.longitude == null) continue;
        const key = pinKey(pin);
        nextKeys.add(key);
        const latlng: [number, number] = [pin.latitude, pin.longitude];
        bounds.push(latlng);

        if (markersRef.current.has(key)) continue;

        const href = `/play/venues/${pin.id ?? pin.slug ?? ""}`;
        const marker = L.marker(latlng, {
          icon: limeIcon,
          sporttekPin: true,
        } as Record<string, unknown>)
          .addTo(map)
          .bindPopup(
            `<div class="play-map-popup"><strong>${escapeHtml(pin.name ?? "Venue")}</strong><br/><a href="${href}">View courts</a></div>`,
          );
        markersRef.current.set(key, marker);
      }

      for (const [key, marker] of markersRef.current) {
        if (nextKeys.has(key)) continue;
        map.removeLayer(marker);
        markersRef.current.delete(key);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: true });
      } else if (bounds.length === 1) {
        map.setView(bounds[0]!, 14);
      } else {
        map.setView([viewportLat, viewportLon], 12);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pins, viewportLat, viewportLon]);

  return (
    <div className={cn("play-map-wrap", className)}>
      <div ref={containerRef} className="absolute inset-0" />
      {pins.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center p-6">
          <div className="pointer-events-auto max-w-sm rounded-2xl border border-black/[0.06] bg-white px-5 py-4 text-center shadow-lg dark:border-white/10 dark:bg-[#17354F]">
            <p className="font-extrabold text-[#17354F] dark:text-white">No venues on the map</p>
            <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-white/55">
              Clear filters or switch back to the list.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
