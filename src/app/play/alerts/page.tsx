"use client";

import Link from "next/link";
import { BellRing, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BrandLoader } from "@/components/play/brand-loader";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch, backendApi } from "@/lib/api";
import { messageForCode } from "@/lib/auth-messages";
import { sportLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

type SubscriptionRow = {
  id?: string;
  label?: string;
  status?: string;
  sports?: string[];
  areas?: string[];
  windowStart?: string;
  windowEnd?: string;
  venues?: { name?: string }[];
  notifyCount?: number;
  daysOfWeek?: number[];
};

const DAY = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AlertsPage() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [maxActive, setMaxActive] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await apiFetch<{
        items?: SubscriptionRow[];
        activeCount?: number;
        maxActive?: number;
      }>(backendApi("api/v1/me/subscriptions"));
      setRows(body.items ?? []);
      setActiveCount(body.activeCount ?? 0);
      setMaxActive(body.maxActive ?? 5);
    } catch (err) {
      const api = err as ApiError;
      setError(
        messageForCode(api.messageCode, api.message, api.fields) ||
          "Could not load alerts.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(row: SubscriptionRow) {
    if (!row.id) return;
    setBusyId(row.id);
    setError(null);
    try {
      const paused = row.status === "PAUSED";
      await apiFetch(
        backendApi(
          `api/v1/me/subscriptions/${row.id}/${paused ? "resume" : "pause"}`,
        ),
        { method: "POST" },
      );
      await load();
    } catch (err) {
      const api = err as ApiError;
      setError(messageForCode(api.messageCode, api.message, api.fields));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17354F] dark:text-white sm:text-4xl">
            Slot alerts
          </h1>
          <p className="mt-1.5 text-base font-medium text-neutral-500 dark:text-white/55">
            Get notified when a preferred window opens. {activeCount}/{maxActive}{" "}
            active.
          </p>
        </div>
        <Button asChild variant="outline" className="h-11 rounded-xl">
          <Link href="/play">Browse venues</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <BrandLoader label="Loading alerts" />
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-black/[0.06] bg-white px-8 py-16 text-center shadow-[0_12px_32px_rgba(23,53,79,0.06)] dark:border-white/10 dark:bg-[#17354F]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F4DC] text-[#4F8F38] dark:bg-[#1E3A24] dark:text-[#D4E22A]">
            <BellRing size={26} />
          </div>
          <p className="mt-4 text-xl font-extrabold text-[#17354F] dark:text-white">
            No alerts yet
          </p>
          <p className="mt-1 max-w-md mx-auto text-sm font-medium text-neutral-500 dark:text-white/55">
            Create alerts from a venue when a busy slot window has no openings.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const active = row.status === "ACTIVE";
            const venues =
              row.venues?.map((v) => v.name).filter(Boolean).join(", ") ||
              row.areas?.join(", ") ||
              "Any venue";
            const days =
              row.daysOfWeek?.map((d) => DAY[d] ?? d).join(" · ") || "Any day";
            const window =
              row.windowStart && row.windowEnd
                ? `${row.windowStart} – ${row.windowEnd}`
                : "Any time";
            return (
              <article
                key={row.id}
                className="flex flex-col rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_24px_rgba(23,53,79,0.06)] dark:border-white/10 dark:bg-[#17354F]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold text-[#17354F] dark:text-white">
                      {row.label?.trim() || venues}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-500 dark:text-white/60">
                      {(row.sports ?? []).map(sportLabel).join(" · ") || "All sports"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide",
                      active
                        ? "bg-[#E8F4DC] text-[#4F8F38] dark:bg-[#1E3A24] dark:text-[#D4E22A]"
                        : "bg-neutral-100 text-neutral-500 dark:bg-white/10 dark:text-white/55",
                    )}
                  >
                    {active ? "Active" : "Paused"}
                  </span>
                </div>

                <dl className="mt-4 space-y-2 rounded-2xl bg-neutral-50 px-4 py-3 text-sm dark:bg-white/5">
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-neutral-400 dark:text-white/45">Where</dt>
                    <dd className="max-w-[60%] truncate text-right font-extrabold text-[#17354F] dark:text-white">
                      {venues}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-neutral-400 dark:text-white/45">Days</dt>
                    <dd className="text-right font-extrabold text-[#17354F] dark:text-white">
                      {days}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-neutral-400 dark:text-white/45">Window</dt>
                    <dd className="text-right font-extrabold text-[#17354F] dark:text-white">
                      {window}
                    </dd>
                  </div>
                  {row.notifyCount != null ? (
                    <div className="flex justify-between gap-3">
                      <dt className="font-semibold text-neutral-400 dark:text-white/45">Notified</dt>
                      <dd className="text-right font-extrabold text-[#17354F] dark:text-white">
                        {row.notifyCount}×
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 h-11 w-full rounded-xl"
                  disabled={busyId === row.id}
                  onClick={() => void toggle(row)}
                >
                  {active ? <Pause size={15} /> : <Play size={15} />}
                  {busyId === row.id
                    ? "Updating…"
                    : active
                      ? "Pause alert"
                      : "Resume alert"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
