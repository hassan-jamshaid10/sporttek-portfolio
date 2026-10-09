"use client";

export type MessageInfo = {
  messageCode?: string;
  description?: string;
  fields?: Record<string, string>;
  createdUuid?: string;
};

export class ApiError extends Error {
  constructor(
    public messageCode: string,
    description: string,
    public fields: Record<string, string> = {},
    public status = 400,
  ) {
    super(description);
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers);
  let body = init?.body;
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  const response = await fetch(path.startsWith("/") ? path : `/api/backend/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    body,
    credentials: "same-origin",
  });
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = text;
    }
  }
  if (!response.ok) {
    const info = (payload ?? {}) as MessageInfo;
    throw new ApiError(
      info.messageCode ?? "ST-008",
      info.description ?? "Request failed.",
      info.fields ?? {},
      response.status,
    );
  }
  return payload as T;
}

export function publicApi(path: string) {
  return `/api/public/${path.replace(/^\//, "")}`;
}

export function backendApi(path: string) {
  return `/api/backend/${path.replace(/^\//, "")}`;
}
