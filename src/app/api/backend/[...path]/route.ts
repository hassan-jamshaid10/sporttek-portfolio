import { NextRequest, NextResponse } from "next/server";
import {
  encryptSessionValue,
  getSessionToken,
  SESSION_COOKIE,
  sessionCookieOptionsForSet,
} from "@/lib/session";
import { apiBaseUrl } from "@/lib/env";
import { jsonError, readJson, upstreamFetch } from "@/lib/upstream";

export const dynamic = "force-dynamic";

async function refresh(token: string): Promise<string | undefined> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!response.ok) {
    return undefined;
  }
  const body = (await response.json()) as { accessToken?: string };
  return body.accessToken;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!path?.length) {
    return jsonError(400, "ST-008", "Missing upstream path.");
  }
  let token = await getSessionToken();
  if (!token) {
    return jsonError(401, "ST-003", "Authentication required.");
  }
  try {
    const body =
      request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
    let upstream = await upstreamFetch(path, {
      method: request.method,
      search: request.nextUrl.search,
      headers: request.headers,
      body,
      token,
    });
    let refreshed: string | undefined;
    if (upstream.status === 401) {
      refreshed = await refresh(token);
      if (!refreshed) {
        const expired = NextResponse.json(
          { messageCode: "ST-003", description: "Authentication required.", fields: {} },
          { status: 401 },
        );
        expired.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptionsForSet(), maxAge: 0 });
        return expired;
      }
      token = refreshed;
      upstream = await upstreamFetch(path, {
        method: request.method,
        search: request.nextUrl.search,
        headers: request.headers,
        body,
        token,
      });
    }
    const contentType = upstream.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await readJson(upstream)
      : await upstream.arrayBuffer();
    const out = contentType.includes("application/json")
      ? NextResponse.json(payload, { status: upstream.status })
      : new NextResponse(payload as ArrayBuffer, { status: upstream.status });
    if (refreshed) {
      out.cookies.set(SESSION_COOKIE, encryptSessionValue(refreshed), sessionCookieOptionsForSet());
    }
    return out;
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Upstream unreachable.";
    return jsonError(502, "ST-008", `API unreachable. ${detail}`);
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
