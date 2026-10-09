"use client";

import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const SPORTS = [
  "PADEL",
  "FUTSAL",
  "CRICKET",
  "TENNIS",
  "TABLE_TENNIS",
  "SNOOKER",
  "SHOOTING",
  "OTHER",
] as const;

export type SportCode = (typeof SPORTS)[number];

export type SortOption = "RECOMMENDED" | "CHEAPEST" | "MOST_BOOKED";

const SPORT_LABEL: Record<string, string> = {
  PADEL: "Padel",
  FUTSAL: "Futsal",
  CRICKET: "Cricket",
  TENNIS: "Tennis",
  TABLE_TENNIS: "Table tennis",
  SNOOKER: "Snooker",
  SHOOTING: "Shooting",
  OTHER: "Other",
};

const SORT_LABEL: Record<SortOption, string> = {
  RECOMMENDED: "Recommended",
  CHEAPEST: "Cheapest",
  MOST_BOOKED: "Most booked",
};

export type VenueFilters = {
  query: string;
  sports: SportCode[];
  areas: string[];
  availableTonight: boolean;
  sort: SortOption;
};

export function VenueFilterBar({
  value,
  areaOptions,
  onChange,
}: {
  value: VenueFilters;
  areaOptions: string[];
  onChange: (next: VenueFilters) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const activeCount = useMemo(() => {
    let n = value.sports.length + value.areas.length;
    if (value.availableTonight) n += 1;
    return n;
  }, [value]);

  function clearFilters() {
    onChange({
      ...value,
      sports: [],
      areas: [],
      availableTonight: false,
    });
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white p-1.5 shadow-[0_8px_24px_rgba(23,53,79,0.08)] dark:border-white/10 dark:bg-[#17354F] dark:shadow-black/40">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            className="h-11 rounded-full border-0 bg-neutral-100/80 pl-10 pr-10 shadow-none focus-visible:ring-0 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45"
            placeholder="Search venues"
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
          />
          {value.query ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Clear search"
              onClick={() => onChange({ ...value, query: "" })}
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <Button
          type="button"
          size="icon"
          variant={activeCount > 0 ? "default" : "ghost"}
          className={cn("relative h-10 w-10 shrink-0", activeCount > 0 && "text-white")}
          title="Filters"
          aria-label="Filters"
          onClick={() => {
            setSortOpen(false);
            setSheetOpen((o) => !o);
          }}
        >
          <SlidersHorizontal size={18} />
          {activeCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#17354F] px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>

        <div className="relative">
          <Button
            type="button"
            size="sm"
            variant={value.sort !== "RECOMMENDED" ? "secondary" : "ghost"}
            className="h-10 gap-1.5 rounded-full px-3"
            title="Sort"
            onClick={() => {
              setSheetOpen(false);
              setSortOpen((o) => !o);
            }}
          >
            <ArrowUpDown size={16} />
            <span className="hidden sm:inline">{SORT_LABEL[value.sort]}</span>
          </Button>
          {sortOpen ? (
            <div className="absolute right-0 top-[calc(100%+8px)] z-40 min-w-[11rem] overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_16px_40px_rgba(23,53,79,0.12)] dark:border-white/10 dark:bg-[#17354F]">
              {(Object.keys(SORT_LABEL) as SortOption[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold dark:text-white",
                    value.sort === option
                      ? "bg-[#65AA2B]/12 text-[#4F8F38] dark:text-[#D4E22A]"
                      : "hover:bg-neutral-50 dark:hover:bg-white/10",
                  )}
                  onClick={() => {
                    onChange({ ...value, sort: option });
                    setSortOpen(false);
                  }}
                >
                  {SORT_LABEL[option]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {sheetOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_16px_40px_rgba(23,53,79,0.12)] dark:border-white/10 dark:bg-[#17354F]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-extrabold text-[#17354F] dark:text-white">Filters</p>
            <button
              type="button"
              className="text-xs font-bold text-[#65AA2B] disabled:opacity-40"
              disabled={activeCount === 0}
              onClick={clearFilters}
            >
              Clear all
            </button>
          </div>

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Sport</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {SPORTS.map((sport) => {
              const on = value.sports.includes(sport);
              return (
                <button
                  key={sport}
                  type="button"
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold",
                    on
                      ? "bg-[#17354F] text-white dark:bg-[#65AA2B] dark:text-[#071018]"
                      : "bg-neutral-100 text-[#17354F] dark:bg-white/10 dark:text-white",
                  )}
                  onClick={() => {
                    const sports = on
                      ? value.sports.filter((s) => s !== sport)
                      : [...value.sports, sport];
                    onChange({ ...value, sports });
                  }}
                >
                  {SPORT_LABEL[sport]}
                </button>
              );
            })}
          </div>

          {areaOptions.length > 0 ? (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Area</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {areaOptions.map((area) => {
                  const on = value.areas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-bold",
                        on
                          ? "bg-[#17354F] text-white dark:bg-[#65AA2B] dark:text-[#071018]"
                          : "bg-neutral-100 text-[#17354F] dark:bg-white/10 dark:text-white",
                      )}
                      onClick={() => {
                        const areas = on
                          ? value.areas.filter((a) => a !== area)
                          : [...value.areas, area];
                        onChange({ ...value, areas });
                      }}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-3 dark:bg-white/10">
            <span className="text-sm font-bold text-[#17354F] dark:text-white">Available tonight</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#65AA2B]"
              checked={value.availableTonight}
              onChange={(e) => onChange({ ...value, availableTonight: e.target.checked })}
            />
          </label>

          <Button type="button" className="mt-4 w-full" onClick={() => setSheetOpen(false)}>
            Apply
          </Button>
        </div>
      ) : null}
    </div>
  );
}
