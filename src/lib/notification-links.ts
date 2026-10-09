/**
 * Player (mobile) notification deep links → /play routes.
 * Backend player links look like: sporttek://bookings/{id}, sporttek://venue/{id}/grid?...
 * Panel paths (/bookings, /deals, /admin/…) are ignored for the player web app.
 */

const PLAYER_TYPES = new Set([
  "BOOKING_CONFIRMED",
  "BOOKING_REMINDER",
  "BOOKING_CANCELLED_BY_PLAYER",
  "BOOKING_CANCELLED_BY_VENUE",
  "DEPOSIT_CONFIRMED",
  "DEPOSIT_REJECTED",
  "DEAL_ALERT",
  "SLOT_FREED_ALERT",
  "WAITLIST_OFFER",
  "RECURRING_CONFIRM_NUDGE",
  "SPLIT_INVITE",
]);

const TYPE_FALLBACK: Record<string, string> = {
  BOOKING_CONFIRMED: "/play/bookings",
  BOOKING_REMINDER: "/play/bookings",
  BOOKING_CANCELLED_BY_PLAYER: "/play/bookings",
  BOOKING_CANCELLED_BY_VENUE: "/play/bookings",
  DEPOSIT_CONFIRMED: "/play/bookings",
  DEPOSIT_REJECTED: "/play/bookings",
  DEAL_ALERT: "/play",
  SLOT_FREED_ALERT: "/play/alerts",
  WAITLIST_OFFER: "/play/bookings",
  RECURRING_CONFIRM_NUDGE: "/play/bookings",
  SPLIT_INVITE: "/play/bookings",
};

export function isPlayerNotificationType(type?: string | null): boolean {
  if (!type) return true;
  return PLAYER_TYPES.has(type);
}

export function labelForPlayerNotification(type?: string | null): string {
  switch (type) {
    case "BOOKING_CONFIRMED":
      return "Booking confirmed";
    case "BOOKING_REMINDER":
      return "Reminder";
    case "BOOKING_CANCELLED_BY_PLAYER":
      return "Booking cancelled";
    case "BOOKING_CANCELLED_BY_VENUE":
      return "Cancelled by venue";
    case "DEPOSIT_CONFIRMED":
      return "Deposit confirmed";
    case "DEPOSIT_REJECTED":
      return "Deposit rejected";
    case "DEAL_ALERT":
      return "Deal";
    case "SLOT_FREED_ALERT":
      return "Slot opened";
    case "WAITLIST_OFFER":
      return "Waitlist offer";
    default:
      return "Notification";
  }
}

/** Resolve a player deepLink (same rules as mobile `appLocationFromUri`). */
export function playHrefFromDeepLink(deepLink?: string | null): string | null {
  const raw = deepLink?.trim();
  if (!raw) return null;

  // Panel / admin paths are not player destinations.
  if (
    raw.startsWith("/admin") ||
    raw.startsWith("/deals") ||
    raw.startsWith("/overview") ||
    raw.startsWith("/settings") ||
    raw.startsWith("/deposits") ||
    /^https?:\/\/[^/]*panel/i.test(raw)
  ) {
    return null;
  }

  let uri: URL;
  try {
    uri = raw.includes("://")
      ? new URL(raw)
      : new URL(raw.startsWith("/") ? raw : `/${raw}`, "https://sporttek.local");
  } catch {
    return null;
  }

  const host = uri.hostname || uri.host;
  const segments = uri.pathname.split("/").filter(Boolean);

  // sporttek://bookings/{id}
  if (host === "bookings" && segments[0]) {
    return `/play/bookings/${segments[0]}${uri.search}`;
  }
  // /bookings/{id} or path form
  if (segments[0] === "bookings" && segments[1]) {
    return `/play/bookings/${segments[1]}${uri.search}`;
  }

  // sporttek://venue/{id}/grid?date=&courtId=&start=&dealId=
  let venueId: string | null = null;
  if (host === "venue" && segments.length >= 2 && segments[segments.length - 1] === "grid") {
    venueId = segments[0] ?? null;
  } else if (segments[0] === "venue" && segments[2] === "grid") {
    venueId = segments[1] ?? null;
  }

  if (venueId) {
    const params = new URLSearchParams();
    for (const key of ["date", "courtId", "start", "dealId", "name"] as const) {
      const v = uri.searchParams.get(key);
      if (v) params.set(key, v);
    }
    const qs = params.toString();
    return `/play/venues/${venueId}/slots${qs ? `?${qs}` : ""}`;
  }

  if (segments[0] === "venues" && segments[1] && segments[2] === "slots") {
    return `/play/venues/${segments[1]}/slots${uri.search}`;
  }
  if (segments[0] === "venues" && segments[1]) {
    return `/play/venues/${segments[1]}${uri.search}`;
  }
  if (host === "venues" || (segments[0] === "venues" && !segments[1])) {
    return "/play";
  }

  if (uri.pathname.startsWith("/play/")) {
    return `${uri.pathname}${uri.search}`;
  }

  return null;
}

/** Mobile-style open: prefer deepLink, else type fallback for player types. */
export function hrefForPlayNotification(
  type?: string | null,
  deepLink?: string | null,
): string | null {
  const fromLink = playHrefFromDeepLink(deepLink);
  if (fromLink) return fromLink;
  if (type && TYPE_FALLBACK[type]) return TYPE_FALLBACK[type];
  return null;
}
