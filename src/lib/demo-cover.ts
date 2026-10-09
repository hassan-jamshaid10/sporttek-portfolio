/** Same sport-to-photo mapping as sporttek-panel `demo-cover.ts` / mobile VenueCoverImage. */
export function demoCoverSrc(sports: string[] = [], name = ""): string {
  const set = new Set(sports.map((sport) => sport.toUpperCase()));
  const label = name.toLowerCase();
  if (set.has("CRICKET") && !set.has("PADEL") && !set.has("FUTSAL")) {
    return "/demo/cricket.png";
  }
  if (set.has("PADEL") && set.has("FUTSAL")) {
    return "/demo/mixed.png";
  }
  if (set.has("PADEL") || label.includes("padel")) {
    return "/demo/padel.png";
  }
  if (set.has("FUTSAL") || label.includes("futsal")) {
    return "/demo/futsal.png";
  }
  if (set.has("CRICKET") || label.includes("cricket")) {
    return "/demo/cricket.png";
  }
  return "/demo/mixed.png";
}

/** Prefer a real cover URL; otherwise the sport demo placeholder. */
export function venueCoverSrc(
  coverUrl: string | null | undefined,
  sports: string[] = [],
  name = "",
): string {
  const trimmed = coverUrl?.trim();
  return trimmed ? trimmed : demoCoverSrc(sports, name);
}
