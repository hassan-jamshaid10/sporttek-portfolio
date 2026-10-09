const KARACHI = "Asia/Karachi";

const TIME = new Intl.DateTimeFormat("en-PK", {
  timeZone: KARACHI,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const DATE = new Intl.DateTimeFormat("en-PK", {
  timeZone: KARACHI,
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function formatTime(value?: string) {
  if (!value) return "—";
  return TIME.format(new Date(value));
}

export function formatDate(value?: string) {
  if (!value) return "—";
  return DATE.format(new Date(value));
}

export function karachiDateInput(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KARACHI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function moneyDisplay(price?: { display?: string; paisa?: number }) {
  if (price?.display) return price.display;
  if (price?.paisa != null) return `Rs ${(price.paisa / 100).toLocaleString("en-PK")}`;
  return "—";
}

/** Pre-discount list price from deal % — same formula as mobile `wasPricePaisa`. */
export function wasPricePaisa(fromPaisa?: number, percent?: number | null) {
  if (fromPaisa == null || percent == null || percent <= 0 || percent >= 100) return null;
  return Math.round((fromPaisa * 100) / (100 - percent));
}

export function moneyFromPaisa(paisa: number) {
  return `Rs ${(paisa / 100).toLocaleString("en-PK")}`;
}

/** Add calendar days to a YYYY-MM-DD string (Karachi business dates). */
export function addDaysIso(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function weekdayShortFromIso(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function monthShortFromIso(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: "UTC",
    month: "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function dayNumFromIso(isoDate: string) {
  return Number(isoDate.slice(8, 10));
}

export function isWeekendIso(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow === 0 || dow === 6;
}

export function formatVerifiedDate(iso?: string) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: KARACHI,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

/** Display "8 am" style from HH:mm */
export function formatHmDisplay(hm: string) {
  const [hStr, mStr] = hm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h)) return hm;
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  if (!m) return `${hour12} ${suffix}`;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}
