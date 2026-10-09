"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePlayUi } from "@/components/play/AppShell";
import { apiFetch, backendApi } from "@/lib/api";

type FavouriteRow = { venueId?: string; id?: string };

type FavouritesApi = {
  ids: Set<string>;
  ready: boolean;
  isFavourite: (venueId: string) => boolean;
  toggle: (venueId: string) => Promise<void>;
};

const FavouritesContext = createContext<FavouritesApi | null>(null);

function rowId(row: FavouriteRow): string | null {
  const id = row.venueId ?? row.id;
  return id?.trim() || null;
}

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { me, authChecked } = usePlayUi();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    if (!me) {
      setIds(new Set());
      setReady(true);
      return;
    }
    try {
      const body = await apiFetch<{ items?: FavouriteRow[] }>(
        backendApi("api/v1/me/favourites"),
      );
      const next = new Set<string>();
      for (const row of body.items ?? []) {
        const id = rowId(row);
        if (id) next.add(id);
      }
      setIds(next);
    } catch {
      setIds(new Set());
    } finally {
      setReady(true);
    }
  }, [me]);

  useEffect(() => {
    if (!authChecked) return;
    setReady(false);
    void reload();
  }, [authChecked, reload]);

  const value = useMemo<FavouritesApi>(
    () => ({
      ids,
      ready,
      isFavourite: (venueId) => ids.has(venueId),
      toggle: async (venueId) => {
        if (!me) {
          window.location.href = `/play/login?next=${encodeURIComponent("/play")}`;
          return;
        }
        const was = ids.has(venueId);
        setIds((prev) => {
          const next = new Set(prev);
          if (was) next.delete(venueId);
          else next.add(venueId);
          return next;
        });
        try {
          await apiFetch(backendApi(`api/v1/me/favourites/${venueId}`), {
            method: was ? "DELETE" : "PUT",
          });
        } catch {
          setIds((prev) => {
            const next = new Set(prev);
            if (was) next.add(venueId);
            else next.delete(venueId);
            return next;
          });
          throw new Error(was ? "Could not remove favourite." : "Could not save favourite.");
        }
      },
    }),
    [ids, ready, me],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites(): FavouritesApi {
  const ctx = useContext(FavouritesContext);
  if (!ctx) {
    return {
      ids: new Set(),
      ready: false,
      isFavourite: () => false,
      toggle: async () => undefined,
    };
  }
  return ctx;
}
