"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useFavourites } from "@/hooks/use-favourites";
import { cn } from "@/lib/utils";

export function VenueFavouriteButton({
  venueId,
  compact = false,
  className,
}: {
  venueId: string;
  compact?: boolean;
  className?: string;
}) {
  const { isFavourite, toggle } = useFavourites();
  const [busy, setBusy] = useState(false);
  const fav = isFavourite(venueId);

  return (
    <button
      type="button"
      disabled={busy}
      aria-label={fav ? "Remove from favourites" : "Save to favourites"}
      title={fav ? "Saved" : "Save"}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-60",
        compact ? "h-8 w-8" : "h-9 w-9",
        className,
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (busy) return;
        setBusy(true);
        void toggle(venueId).finally(() => setBusy(false));
      }}
    >
      <Heart
        size={compact ? 15 : 17}
        className={cn(fav ? "fill-red-500 text-red-500" : "text-white")}
        strokeWidth={2.4}
      />
    </button>
  );
}
