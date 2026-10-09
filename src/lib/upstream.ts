import { apiBaseUrl } from "@/lib/env";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "cookie",
  // Browser CORS headers must not be forwarded server→API. Spring CorsFilter
  // rejects disallowed Origin (e.g. localhost:3000 against prod panel-only list)
  // with 403 — that looked like "Request failed" on /play checkout.
  "origin",
  "referer",
  "sec-fetch-site",
  "sec-fetch-mode",
  "sec-fetch-dest",
  "sec-fetch-user",
]);

export async function upstreamFetch(
  path: string[],
  init: {
    method: string;
    search?: string;
    headers?: Headers;
    body?: ArrayBuffer | undefined;
    token?: string;
  },
): Promise<Response> {
  const url = `${apiBaseUrl()}/${path.join("/")}${init.search ?? ""}`;
  const headers = new Headers();
  init.headers?.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  headers.delete("cookie");
  headers.delete("origin");
  headers.delete("referer");
  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  } else {
    // Do not leak a browser Authorization header into a public upstream call.
    headers.delete("authorization");
  }
  return fetch(url, {
    method: init.method,
    headers,
    body: init.body,
    redirect: "manual",
  });
}

export async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function jsonError(status: number, messageCode: string, description: string) {
  return Response.json({ messageCode, description, fields: {} }, { status });
}
