import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/env";
import { encryptSessionValue, SESSION_COOKIE, sessionCookieOptionsForSet } from "@/lib/session";
import { readJson } from "@/lib/upstream";

export const dynamic = "force-dynamic";

function errorJson(
  status: number,
  messageCode: string,
  description: string,
  fields: Record<string, string> = {},
) {
  return NextResponse.json({ messageCode, description, fields }, { status });
}

export async function POST(request: Request) {
  let json: Record<string, unknown>;
  try {
    json = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorJson(400, "ST-002", "Invalid request body.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBaseUrl()}/api/v1/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...json, platform: "WEB" }),
    });
  } catch {
    return errorJson(502, "ST-008", "Could not reach SportTek auth.");
  }

  const body = (await readJson(upstream)) as {
    accessToken?: string;
    messageCode?: string;
    description?: string;
    fields?: Record<string, string>;
    [key: string]: unknown;
  } | null;

  if (!upstream.ok) {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return NextResponse.json(
        {
          messageCode: body.messageCode ?? "ST-008",
          description: body.description ?? "Sign-in failed.",
          fields: body.fields ?? {},
        },
        { status: upstream.status },
      );
    }
    return errorJson(upstream.status || 502, "ST-008", "Sign-in failed.");
  }

  if (!body || typeof body !== "object") {
    return errorJson(502, "ST-008", "Empty auth response.");
  }

  const { accessToken, ...safe } = body;
  if (typeof accessToken !== "string" || !accessToken) {
    return errorJson(502, "ST-008", "Auth response missing session token.");
  }

  try {
    const response = NextResponse.json(safe, { status: upstream.status });
    response.cookies.set(
      SESSION_COOKIE,
      encryptSessionValue(accessToken),
      sessionCookieOptionsForSet(),
    );
    return response;
  } catch {
    return errorJson(500, "ST-008", "Could not create session cookie.");
  }
}
