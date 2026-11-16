import "server-only";

import { suspensionRequest } from "../organizations/lifecycle";
import { AUTH_PATHS, ENROLLMENT_PATHS, type AuthOperation } from "./contracts";
import { approvedSetCookies, authConfig, platformCookies } from "./policy";
import {
  organizationApiPath,
  type OrganizationTarget,
} from "../organizations/contracts";

export function getAuthConfig() {
  return authConfig(
    process.env.AKIBA_ADMIN_ORIGIN,
    process.env.AKIBA_API_ORIGIN,
    process.env.NODE_ENV === "production",
  );
}

export async function boundedJson(
  response: Pick<Response, "body">,
  maximum = 32768,
  allowEmpty = false,
): Promise<unknown> {
  if (!response.body) throw new Error("Missing response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let timedOut = false;
  const deadline = setTimeout(() => {
    timedOut = true;
    void reader.cancel().catch(() => undefined);
  }, 5000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximum) throw new Error("Response limit exceeded.");
      chunks.push(value);
    }
  } finally {
    clearTimeout(deadline);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  if (timedOut) throw new Error("Response deadline exceeded.");
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(joined);
  return allowEmpty && text.length === 0 ? null : JSON.parse(text);
}

export async function backendRequest(
  operation: AuthOperation,
  cookie: string,
  body?: unknown,
  csrf?: string,
) {
  return requestBackend(
    { ...AUTH_PATHS, ...ENROLLMENT_PATHS }[operation],
    cookie,
    operation === "session" ? "GET" : "POST",
    body,
    csrf,
  );
}

export async function backendOrganizationRequest(
  target: OrganizationTarget,
  cookie: string,
) {
  return requestBackend(
    organizationApiPath(target),
    cookie,
    "GET",
    undefined,
    undefined,
    131072,
  );
}

/** Fixed authenticated mutation for the verified platform organization endpoint. */
export async function backendCreateOrganizationRequest(
  cookie: string,
  body: { name: string; slug: string },
  csrf: string,
) {
  return requestBackend(
    "/api/v1/platform/organizations",
    cookie,
    "POST",
    body,
    csrf,
  );
}

/** Name-only update; the API enforces permission, lifecycle and optimistic concurrency. */
export async function backendUpdateOrganizationRequest(
  cookie: string,
  id: string,
  body: { name: string },
  csrf: string,
  updatedAt: string,
) {
  return requestBackend(
    organizationApiPath({ kind: "detail", id }),
    cookie,
    "PATCH",
    body,
    csrf,
    32768,
    `"${updatedAt}"`,
  );
}

/** The API accepts only expectedUpdatedAt for this lifecycle operation. */
export async function backendSuspendOrganizationRequest(
  cookie: string,
  id: string,
  expectedUpdatedAt: string,
  csrf: string,
) {
  const request = suspensionRequest({ id, updatedAt: expectedUpdatedAt });
  return requestBackend(
    request.path,
    cookie,
    request.method,
    request.body,
    csrf,
  );
}

async function requestBackend(
  path: string,
  cookie: string,
  method: "GET" | "POST" | "PATCH",
  body?: unknown,
  csrf?: string,
  maximum = 32768,
  ifMatch?: string,
) {
  const config = getAuthConfig();
  const incoming = platformCookies(cookie, config.secure);
  const headers = new Headers({
    Accept: "application/json, application/problem+json",
    Origin: config.adminOrigin,
  });
  if (incoming.header) headers.set("Cookie", incoming.header);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (ifMatch) headers.set("If-Match", ifMatch);
  if (csrf) headers.set("x-platform-csrf-token", csrf);
  const response = await fetch(config.apiOrigin + path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(25000),
  });
  const setCookies = approvedSetCookies(
    response.headers.getSetCookie(),
    config.secure,
  );
  if (response.status === 204)
    return { status: 204, body: null, cookies: setCookies };
  const contentType = response.headers
    .get("content-type")
    ?.split(";")[0]
    .trim();
  if (
    contentType !== "application/json" &&
    contentType !== "application/problem+json"
  )
    throw new Error("Unexpected response.");
  return {
    status: response.status,
    body: await boundedJson(response, maximum),
    cookies: setCookies,
  };
}
