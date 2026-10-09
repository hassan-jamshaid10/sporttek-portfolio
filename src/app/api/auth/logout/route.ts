import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/env";
import { getSessionToken, SESSION_COOKIE, sessionCookieOptionsForSet } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const token = await getSessionToken();
  if (token) {
    try {
      await fetch(`${apiBaseUrl()}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
    } catch {
      // clear cookie anyway
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptionsForSet(), maxAge: 0 });
  return response;
}
