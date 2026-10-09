export function apiBaseUrl(): string {
  const url = process.env.SPORTTEK_API_BASE_URL?.trim() || process.env.API_BASE_URL?.trim();
  if (!url) {
    throw new Error("Set SPORTTEK_API_BASE_URL (e.g. https://api.sporttek.pk) in .env");
  }
  return url.replace(/\/$/, "");
}

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error("Set SESSION_SECRET (min 16 chars) in .env");
  }
  return secret;
}

export function sessionDays(): number {
  const raw = process.env.SESSION_DAYS?.trim();
  const days = raw ? Number(raw) : 30;
  return Number.isFinite(days) && days > 0 ? days : 30;
}
