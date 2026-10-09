"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch, backendApi } from "@/lib/api";
import { messageForCode } from "@/lib/auth-messages";
import { formatDate, formatTime, moneyDisplay } from "@/lib/format";
import { sportLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { BookingRow } from "@/lib/types";

type Scope = "UPCOMING" | "PAST";

function statusTone(status?: string) {
  if (!status) return "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-white/70";
  if (status === "CONFIRMED" || status === "COMPLETED") {
    return "bg-[#E8F4DC] text-[#4F8F38] dark:bg-[#1E3A24] dark:text-[#D4E22A]";
  }
  if (status === "HELD" || status?.startsWith("PENDING")) {
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100";
  }
  if (status.includes("CANCEL")) {
    return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200";
  }
  return "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-white/70";
}

function prettyStatus(status?: string) {
  if (!status) return "Booking";
  return status
    .toLowerCase()
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default function BookingsPage() {
  const [scope, setScope] = useState<Scope>("UPCOMING");
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (next: Scope) => {
    setLoading(true);
    setError(null);
    try {
      const body = await apiFetch<{ items?: BookingRow[] }>(
        backendApi(`api/v1/me/bookings?scope=${next}&page=0&size=40`),
      );
      setRows(body.items ?? []);
    } catch (err) {
      const api = err as ApiError;
      setError(
        messageForCode(api.messageCode, api.message, api.fields) ||
          "Could not load bookings.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(scope);
  }, [scope, load]);

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#17354F] dark:text-white sm:text-3xl md:text-4xl">
            My bookings
          </h1>
          <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-white/55 sm:mt-1.5 sm:text-base">
            Upcoming holds and past courts. Open a row for the ticket.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button asChild variant="outline" className="h-10 w-full rounded-xl sm:h-11 sm:w-auto">
            <Link href="/play">Book a court</Link>
          </Button>
          <Button asChild variant="outline" className="h-10 w-full rounded-xl sm:h-11 sm:w-auto">
            <Link href="/play/profile">Profile</Link>
          </Button>
        </div>
      </div>

      <div className="flex w-full rounded-2xl border border-black/[0.06] bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#17354F] sm:inline-flex sm:w-auto sm:p-1.5">
        {(["UPCOMING", "PAST"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setScope(tab)}
            className={cn(
              "min-h-10 flex-1 rounded-xl px-3 py-2 text-sm font-extrabold transition sm:flex-none sm:px-5 sm:py-2.5",
              scope === tab
                ? "bg-[#17354F] text-white dark:bg-[#65AA2B] dark:text-[#071018]"
                : "text-neutral-500 hover:text-[#17354F] dark:text-white/55 dark:hover:text-white",
            )}
          >
            {tab === "UPCOMING" ? "Upcoming" : "Past"}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100 sm:px-5 sm:py-3.5">
          {error}
        </div>
      ) : null}

      {loading ? (
        <BrandLoader label="Loading bookings" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.06] bg-white px-5 py-12 text-center shadow-[0_12px_32px_rgba(23,53,79,0.06)] dark:border-white/10 dark:bg-[#17354F] sm:rounded-3xl sm:px-8 sm:py-16">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F4DC] text-[#4F8F38] dark:bg-[#1E3A24] dark:text-[#D4E22A] sm:h-14 sm:w-14">
            <CalendarDays size={24} />
          </div>
          <p className="mt-4 text-lg font-extrabold text-[#17354F] dark:text-white sm:text-xl">
            {scope === "UPCOMING" ? "No upcoming bookings" : "No past bookings"}
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-white/55">
            {scope === "UPCOMING"
              ? "Find a court on Home and lock a slot."
              : "Completed and cancelled bookings will show here."}
          </p>
          {scope === "UPCOMING" ? (
            <Button asChild className="mt-5 w-full max-w-xs rounded-xl sm:mt-6 sm:w-auto">
              <Link href="/play">Browse venues</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/play/bookings/${row.id}`}
              className="group flex min-w-0 flex-col rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_8px_24px_rgba(23,53,79,0.06)] transition hover:-translate-y-0.5 hover:border-[#65AA2B]/35 hover:shadow-[0_14px_32px_rgba(23,53,79,0.1)] dark:border-white/10 dark:bg-[#17354F] sm:rounded-3xl sm:p-5"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold text-[#17354F] dark:text-white sm:text-lg">
                    {row.venueName ?? "Venue"}
                  </p>
                  <p className="mt-1 flex min-w-0 items-center gap-1 text-xs font-semibold text-neutral-500 dark:text-white/60 sm:text-sm">
                    <MapPin size={13} className="shrink-0 text-[#65AA2B]" />
                    <span className="truncate">
                      {row.courtName ?? "Court"}
                      {row.sport ? ` · ${sportLabel(row.sport)}` : ""}
                    </span>
                  </p>
                </div>
                <span
                  className={cn(
                    "max-w-[42%] shrink-0 rounded-lg px-1.5 py-1 text-center text-[9px] font-extrabold uppercase leading-tight tracking-wide sm:max-w-none sm:px-2 sm:text-[10px]",
                    statusTone(row.status),
                  )}
                >
                  {prettyStatus(row.status)}
                </span>
              </div>

              <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5 sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-3">
                <p className="text-xs font-extrabold leading-snug text-[#17354F] dark:text-white sm:text-sm">
                  {formatDate(row.startAt)} · {formatTime(row.startAt)}
                  {row.endAt ? ` – ${formatTime(row.endAt)}` : ""}
                </p>
                {row.durationMinutes ? (
                  <p className="mt-0.5 text-[11px] font-semibold text-neutral-500 dark:text-white/50 sm:text-xs">
                    {row.durationMinutes} min
                  </p>
                ) : null}
              </div>

              <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:gap-3 sm:pt-4">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-[#4F8F38] dark:text-[#D4E22A] sm:text-base">
                    {moneyDisplay(row.price)}
                  </p>
                  {row.reference ? (
                    <p className="mt-0.5 break-all font-mono text-[10px] font-bold text-neutral-400 dark:text-white/40 sm:text-[11px]">
                      {row.reference}
                    </p>
                  ) : null}
                </div>
                <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-extrabold text-[#17354F] group-hover:text-[#4F8F38] dark:text-white dark:group-hover:text-[#D4E22A]">
                  Ticket
                  <ChevronRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
