import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/session";
import { jsonError, readJson, upstreamFetch } from "@/lib/upstream";

export const dynamic = "force-dynamic";

/** Public discovery / availability / hero / deals — optional bearer if logged in. */
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!path?.length) {
    return jsonError(400, "ST-008", "Missing upstream path.");
  }
  try {
    const token = await getSessionToken();
    const body =
      request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
    const upstream = await upstreamFetch(path, {
      method: request.method,
      search: request.nextUrl.search,
      headers: request.headers,
      body,
      token,
    });
    const contentType = upstream.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return NextResponse.json(await readJson(upstream), { status: upstream.status });
    }
    return new NextResponse(await upstream.arrayBuffer(), { status: upstream.status });
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
