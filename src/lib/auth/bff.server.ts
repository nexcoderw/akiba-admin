import "server-only";

import { randomUUID } from "node:crypto";
import { csrfMatches } from "./csrf-policy";
import { backendRequest, boundedJson, getAuthConfig } from "./backend.server";
import {
  isRecord,
  parseChallenge,
  parseEmailCodeDelivery,
  parseSession,
  parseVerification,
  safeProblem,
  validLoginBody,
  validVerificationBody,
  isEnrollment,
  needsCsrf,
  validEnrollmentBody,
  parseEnrollmentState,
  parseEnrollmentSetup,
  parseEnrollmentComplete,
  type AuthOperation,
} from "./contracts";
import { browserOriginAllowed, cookieNames, platformCookies } from "./policy";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Cookie, Origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function problem(
  status: number,
  operation: AuthOperation,
  source: unknown = {},
) {
  const safe = safeProblem(status, source, operation);
  return Response.json(
    {
      type: "about:blank",
      title: safe.message,
      status,
      detail: safe.message,
      code: safe.code,
      requestId: safe.requestId ?? randomUUID(),
    },
    {
      status,
      headers: {
        ...privateHeaders,
        "Content-Type": "application/problem+json",
      },
    },
  );
}

export async function handle(
  operation: AuthOperation,
  request: Request,
): Promise<Response> {
  try {
    const config = getAuthConfig();
    if (
      !browserOriginAllowed(
        request.headers,
        config.adminOrigin,
        operation !== "session",
      )
    ) {
      return problem(403, operation, { code: "ACCESS_DENIED" });
    }
    const cookie = request.headers.get("cookie") ?? "";
    const incoming = platformCookies(cookie, config.secure);
    let upstreamCookie = cookie;
    const csrf = request.headers.get("x-platform-csrf-token");
    if (needsCsrf(operation) && !csrfMatches(incoming.csrf, csrf)) {
      return problem(403, operation, { code: "ACCESS_DENIED" });
    }
    let input: unknown;
    if (
      operation === "login" ||
      operation === "verify" ||
      isEnrollment(operation)
    ) {
      if (
        request.headers.get("content-type")?.split(";")[0].trim() !==
        "application/json"
      )
        return problem(415, operation);
      try {
        input = await boundedJson(request, 32768);
      } catch {
        return problem(400, operation, { code: "VALIDATION_FAILED" });
      }
      if (
        !(isEnrollment(operation)
          ? validEnrollmentBody(operation, input)
          : operation === "login"
            ? validLoginBody(input)
            : validVerificationBody(input))
      ) {
        return problem(400, operation, { code: "VALIDATION_FAILED" });
      }
    } else if (operation === "logout" || operation === "sendEmailCode") {
      // Drain an empty POST safely; these commands accept only cookie proofs.
      if (request.body) {
        try {
          if ((await boundedJson(request, 1, true)) !== null)
            return problem(400, operation);
        } catch {
          return problem(400, operation);
        }
      }
      if (operation === "sendEmailCode") {
        const names = cookieNames(config.secure);
        const challenge = incoming.header
          .split("; ")
          .find((item) => item.startsWith(`${names.challenge}=v1.`));
        if (!challenge || !incoming.csrf) return problem(401, operation);
        upstreamCookie = `${challenge}; ${names.csrf}=${incoming.csrf}`;
      }
    }
    const result = await backendRequest(
      operation,
      upstreamCookie,
      input,
      csrf ?? undefined,
    );
    if (operation === "sendEmailCode" && result.cookies.length !== 0)
      return problem(502, operation);
    let response: Response;
    if (result.status >= 400) {
      response = problem(result.status, operation, result.body);
    } else {
      const output = isEnrollment(operation)
        ? operation === "enrollmentSetup"
          ? parseEnrollmentSetup(result.body)
          : operation === "enrollmentComplete"
            ? parseEnrollmentComplete(result.body)
            : parseEnrollmentState(result.body)
        : operation === "login"
          ? parseChallenge(result.body)
          : operation === "sendEmailCode"
            ? parseEmailCodeDelivery(result.body)
            : operation === "verify" && validVerificationBody(input)
              ? parseVerification(result.body, input.method)
              : operation === "session"
                ? parseSession(result.body)
                : null;
      if (operation === "logout" || operation === "enrollmentCancel") {
        if (result.status !== 204) return problem(502, operation);
        const cleared = new Set(
          result.cookies.map((item) => item.split("=")[0]),
        );
        if (
          !Object.values(cookieNames(config.secure)).every((name) =>
            cleared.has(name),
          )
        )
          return problem(502, operation);
        response = new Response(null, { status: 204, headers: privateHeaders });
      } else {
        if (result.status !== 200 || !output) return problem(502, operation);
        if (operation === "enrollmentExchange") {
          const issued = platformCookies(
            result.cookies.map((item) => item.split(";")[0]).join("; "),
            config.secure,
          );
          if (
            !issued.csrf ||
            !issued.header.includes(
              cookieNames(config.secure).challenge + "=v1.",
            )
          )
            return problem(502, operation);
        }
        if (operation === "enrollmentComplete") {
          const cleared = new Set(
            result.cookies.map((item) => item.split("=")[0]),
          );
          if (
            !Object.values(cookieNames(config.secure)).every((name) =>
              cleared.has(name),
            )
          )
            return problem(502, operation);
        }
        if (operation === "login" || operation === "verify") {
          const issued = platformCookies(
            result.cookies.map((item) => item.split(";")[0]).join("; "),
            config.secure,
          );
          const names = cookieNames(config.secure);
          const required =
            operation === "login" ? names.challenge : names.session;
          if (
            !issued.header
              .split("; ")
              .some(
                (item) =>
                  item.startsWith(required + "=") &&
                  item.length > required.length + 1,
              ) ||
            !isRecord(result.body) ||
            !csrfMatches(
              issued.csrf,
              typeof result.body.csrfToken === "string"
                ? result.body.csrfToken
                : null,
            )
          )
            return problem(502, operation);
        }
        response = Response.json(output, { headers: privateHeaders });
      }
    }
    // Cookie clearing on terminal MFA failures must reach the browser as well.
    for (const cookie of result.cookies)
      response.headers.append("Set-Cookie", cookie);
    return response;
  } catch {
    return problem(503, operation, { code: "SERVICE_UNAVAILABLE" });
  }
}

export function login(request: Request) {
  return handle("login", request);
}
export function verify(request: Request) {
  return handle("verify", request);
}
export function sendEmailCode(request: Request) {
  return handle("sendEmailCode", request);
}
export function session(request: Request) {
  return handle("session", request);
}
export function logout(request: Request) {
  return handle("logout", request);
}
