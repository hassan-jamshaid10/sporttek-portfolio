import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/env";
import { getSessionToken } from "@/lib/session";
import { readJson } from "@/lib/upstream";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json(
      { messageCode: "ST-003", description: "Authentication required.", fields: {} },
      { status: 401 },
    );
  }
  const upstream = await fetch(`${apiBaseUrl()}/api/v1/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  return NextResponse.json(await readJson(upstream), { status: upstream.status });
}
