export const SESSION_COOKIE = "sporttek_player_session";
export const DEFAULT_SESSION_DAYS = 30;

export function sessionMaxAgeSeconds(days = DEFAULT_SESSION_DAYS): number {
  return Math.max(1, days) * 60 * 60 * 24;
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
