import { cookies } from "next/headers";
import { DEFAULT_SESSION_DAYS, SESSION_COOKIE, sessionCookieOptions, sessionMaxAgeSeconds } from "@/lib/cookie-options";
import { sessionDays, sessionSecret } from "@/lib/env";
import { decryptToken, encryptToken } from "@/lib/session-crypto";

export { SESSION_COOKIE, DEFAULT_SESSION_DAYS };

export async function getSessionToken(): Promise<string | undefined> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return undefined;
  }
  return decryptToken(raw, sessionSecret());
}

export function encryptSessionValue(token: string): string {
  return encryptToken(token, sessionSecret());
}

export function sessionCookieOptionsForSet() {
  return sessionCookieOptions(sessionMaxAgeSeconds(sessionDays()));
}
