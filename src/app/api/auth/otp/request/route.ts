import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/env";
import { readJson } from "@/lib/upstream";

export const dynamic = "force-dynamic";

function errorJson(status: number, messageCode: string, description: string) {
  return NextResponse.json({ messageCode, description, fields: {} }, { status });
}

export async function POST(request: Request) {
  let json: { phone?: unknown };
  try {
    json = (await request.json()) as { phone?: unknown };
  } catch {
    return errorJson(400, "ST-002", "Invalid request body.");
  }

  const phone = typeof json.phone === "string" ? json.phone : "";
  const forwarded =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (forwarded) {
    headers["X-Forwarded-For"] = forwarded;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBaseUrl()}/api/v1/auth/otp/request`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone }),
    });
  } catch {
    return errorJson(502, "ST-008", "Could not reach SportTek auth.");
  }

  const body = await readJson(upstream);
  if (!upstream.ok) {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return NextResponse.json(body, { status: upstream.status });
    }
    return errorJson(upstream.status || 502, "ST-008", "Could not send code.");
  }

  if (!body || typeof body !== "object") {
    return errorJson(502, "ST-008", "Empty OTP response.");
  }

  return NextResponse.json(body, { status: upstream.status });
}
