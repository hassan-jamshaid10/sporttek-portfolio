"use client";

import { useRouter } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch, backendApi } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import {
  hrefForPlayNotification,
  isPlayerNotificationType,
  labelForPlayerNotification,
} from "@/lib/notification-links";
import { cn } from "@/lib/utils";

type PlayNotification = {
  id: string;
  type?: string;
  title?: string | null;
  body?: string | null;
  deepLink?: string | null;
  read?: boolean;
  createdAt?: string;
};

type PageMeta = {
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

const PAGE_SIZE = 15;

function whenLabel(value?: string) {
  if (!value) return "";
  try {
    return `${formatDate(value)} · ${formatTime(value)}`;
  } catch {
    return "";
  }
}

export function PlayHeaderNotifications({
  loggedIn,
  className,
}: {
  loggedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PlayNotification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = page + 1 < totalPages;

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!loggedIn) return;
      if (append) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const body = await apiFetch<{ items?: PlayNotification[]; page?: PageMeta }>(
          backendApi(`api/v1/notifications?page=${nextPage}&size=${PAGE_SIZE}`),
        );
        const rows = (body.items ?? []).filter((row) =>
          isPlayerNotificationType(row.type),
        );
        setItems((prev) => {
          if (!append) return rows;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...rows.filter((r) => !seen.has(r.id))];
        });
        setPage(body.page?.page ?? nextPage);
        setTotalPages(body.page?.totalPages ?? 0);
      } catch {
        if (!append) {
          setItems([]);
          setError("Could not load notifications.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [loggedIn],
  );

  useEffect(() => {
    if (!loggedIn) {
      setItems([]);
      setPage(0);
      setTotalPages(0);
      return;
    }
    void fetchPage(0, false);
    const id = window.setInterval(() => {
      if (!open) void fetchPage(0, false);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [loggedIn, fetchPage, open]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && loggedIn) {
      void fetchPage(0, false);
    }
  }

  function onScrollList() {
    const node = listRef.current;
    if (!node || loadingMoreRef.current || !hasMore) return;
    const nearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 48;
    if (nearBottom) {
      void fetchPage(page + 1, true);
    }
  }

  async function openItem(item: PlayNotification) {
    setOpen(false);
    if (!item.read) {
      setItems((current) =>
        current.map((row) => (row.id === item.id ? { ...row, read: true } : row)),
      );
      void apiFetch(backendApi(`api/v1/notifications/${item.id}/read`), {
        method: "POST",
      }).catch(() => undefined);
    }
    const href = hrefForPlayNotification(item.type, item.deepLink);
    if (href) router.push(href);
  }

  const unread = items.filter((item) => !item.read).length;

  if (!loggedIn) {
    return (
      <Button
        type="button"
        size="icon"
        variant="outline"
        className={cn("h-9 w-9 sm:h-10 sm:w-10", className)}
        title="Notifications"
        aria-label="Notifications"
        onClick={() => router.push(`/play/login?next=${encodeURIComponent("/play")}`)}
      >
        <Bell size={17} />
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className={cn("relative h-9 w-9 sm:h-10 sm:w-10", className)}
          title="Notifications"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell size={17} />
          {unread > 0 ? (
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#17354F]"
              aria-hidden
            />
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        collisionPadding={10}
        className="w-[min(22rem,calc(100vw-1rem))] p-0"
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 dark:border-white/10">
          <p className="text-sm font-extrabold">Notifications</p>
          {unread > 0 ? (
            <span className="rounded-full bg-[#65AA2B]/15 px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-[#4F8F38] dark:text-[#D4E22A]">
              {unread} new
            </span>
          ) : null}
        </div>

        <div
          ref={listRef}
          className="max-h-[min(22rem,55dvh)] overflow-y-auto overscroll-contain"
          onScroll={onScrollList}
        >
          {loading && items.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs font-semibold text-neutral-500 dark:text-white/50">
              Loading…
            </p>
          ) : error && items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs font-semibold text-neutral-500 dark:text-white/50">{error}</p>
              <button
                type="button"
                className="mt-2 text-xs font-extrabold text-[#4F8F38] underline dark:text-[#D4E22A]"
                onClick={() => void fetchPage(0, false)}
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs font-semibold leading-relaxed text-neutral-500 dark:text-white/50">
              Nothing waiting right now. Booking confirmations, deals, and slot alerts show up here.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.06] dark:divide-white/10">
              {items.map((item) => {
                const href = hrefForPlayNotification(item.type, item.deepLink);
                const title =
                  item.title?.trim() || labelForPlayerNotification(item.type);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={!href}
                      className={cn(
                        "flex w-full items-start gap-2 px-4 py-3 text-left transition-colors",
                        href
                          ? "hover:bg-[#65AA2B]/10 dark:hover:bg-white/10"
                          : "cursor-default opacity-80",
                        !item.read && "bg-[#65AA2B]/[0.07]",
                      )}
                      onClick={() => void openItem(item)}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          item.read ? "bg-transparent" : "bg-[#65AA2B]",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-sm leading-snug text-[#17354F] dark:text-white",
                            item.read ? "font-semibold" : "font-extrabold",
                          )}
                        >
                          {title}
                        </span>
                        {item.body ? (
                          <span className="mt-0.5 line-clamp-2 block text-xs font-medium leading-relaxed text-neutral-500 dark:text-white/55">
                            {item.body}
                          </span>
                        ) : null}
                        {item.createdAt ? (
                          <span className="mt-1 block text-[10px] font-semibold text-neutral-400 dark:text-white/40">
                            {whenLabel(item.createdAt)}
                          </span>
                        ) : null}
                      </span>
                      {href ? (
                        <ChevronRight
                          size={14}
                          className="mt-1 shrink-0 text-neutral-300 dark:text-white/25"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {loadingMore ? (
            <p className="px-4 py-3 text-center text-[11px] font-semibold text-neutral-400 dark:text-white/40">
              Loading more…
            </p>
          ) : null}

          {!loading && !loadingMore && hasMore ? (
            <button
              type="button"
              className="flex w-full items-center justify-center py-3 text-xs font-extrabold text-[#4F8F38] hover:bg-[#65AA2B]/10 dark:text-[#D4E22A] dark:hover:bg-white/10"
              onClick={() => void fetchPage(page + 1, true)}
            >
              Show more
            </button>
          ) : null}

          {!loading && !hasMore && items.length > 0 ? (
            <p className="px-4 py-3 text-center text-[11px] font-semibold text-neutral-400 dark:text-white/40">
              You&apos;re all caught up
            </p>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
