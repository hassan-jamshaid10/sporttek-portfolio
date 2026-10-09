import type { Me } from "@/lib/types";

/** In-memory /api/auth/me cache so AppShell remounts (or revalidates) stay instant. */
type MeCache = { me: Me | null; checkedAt: number };

let cache: MeCache | null = null;
let inflight: Promise<Me | null> | null = null;

const FRESH_MS = 60_000;

export function peekPlayMe(): MeCache | null {
  return cache;
}

export function writePlayMe(me: Me | null) {
  cache = { me, checkedAt: Date.now() };
}

export function clearPlayMe() {
  cache = null;
  inflight = null;
}

export async function loadPlayMe(opts?: { force?: boolean }): Promise<Me | null> {
  if (!opts?.force && cache && Date.now() - cache.checkedAt < FRESH_MS) {
    return cache.me;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (!res.ok) {
        writePlayMe(null);
        return null;
      }
      const body = (await res.json()) as Me;
      const phone = body.phone ?? body.phoneE164;
      const me: Me = {
        ...body,
        phone,
        phoneE164: phone,
        photoUrl: body.photoUrl ?? body.avatarUrl,
        avatarUrl: body.avatarUrl ?? body.photoUrl,
      };
      writePlayMe(me);
      return me;
    } catch {
      writePlayMe(null);
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
