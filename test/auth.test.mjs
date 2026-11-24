import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTH_PATHS,
  loginErrors,
  needsCsrf,
  parseChallenge,
  parseEmailCodeDelivery,
  parseSession,
  parseVerification,
  safeDestination,
  safeProblem,
  sessionResult,
  validLoginBody,
  validVerificationBody,
  verificationBody,
} from "../src/lib/auth/contracts.ts";
import {
  approvedSetCookies,
  authConfig,
  browserOriginAllowed,
  cookieNames,
  platformCookies,
} from "../src/lib/auth/policy.ts";
import { csrfMatches } from "../src/lib/auth/csrf-policy.ts";

const expiry = "2099-01-01T00:00:00.000Z";
const session = {
  authenticated: true,
  mfaVerified: true,
  userId: "synthetic-user",
  platformStaffId: "synthetic-staff",
  displayName: "Test Administrator",
  email: "admin@example.com",
  expiresAt: expiry,
  roles: ["platform.owner"],
  permissions: ["platform.dashboard.read"],
};
const token = "a".repeat(43);
const origin = "https://admin.example.com";

test("CSRF verification requires a correctly formatted matching cookie and header", () => {
  assert.equal(csrfMatches(token, token), true);
  assert.equal(csrfMatches(undefined, token), false);
  assert.equal(csrfMatches(token, null), false);
  assert.equal(csrfMatches(token, "b".repeat(43)), false);
  assert.equal(csrfMatches(token, "a".repeat(32)), false);
  assert.equal(csrfMatches("", ""), false);
  assert.equal(csrfMatches("é".repeat(43), "é".repeat(43)), false);
});

test("backend adapters use the actual four platform authentication endpoints", () => {
  assert.deepEqual(AUTH_PATHS, {
    login: "/api/v1/platform/auth/login",
    sendEmailCode: "/api/v1/platform/auth/mfa/email",
    verify: "/api/v1/platform/auth/mfa/verify",
    session: "/api/v1/platform/auth/me",
    logout: "/api/v1/platform/auth/logout",
  });
});

test("login validation gives safe required-field errors", () => {
  assert.deepEqual(loginErrors("", ""), {
    email: "Enter your email address.",
    password: "Enter your password.",
  });
});

for (const email of [
  "wrong",
  "a@@example.com",
  "a @example.com",
  "a".repeat(255) + "@example.com",
]) {
  test(`invalid email is rejected: ${email.slice(0, 20)}`, () => {
    assert.ok(loginErrors(email, "unchanged password").email);
  });
}

test("login accepts existing short credentials without imposing a creation policy", () => {
  assert.deepEqual(loginErrors("admin@example.com", "x"), {});
});

test("password validation preserves surrounding whitespace", () => {
  const body = { email: "admin@example.com", password: "  unchanged secret  " };
  assert.equal(validLoginBody(body), true);
  assert.equal(body.password, "  unchanged secret  ");
});

test("password byte limits reject oversized multibyte input and malformed Unicode", () => {
  assert.ok(loginErrors("admin@example.com", "é".repeat(2049)).password);
  assert.ok(loginErrors("admin@example.com", "\ud800").password);
});

test("privileged fields and malformed login payloads are rejected", () => {
  for (const input of [
    null,
    [],
    { email: 42, password: "x" },
    { email: "admin@example.com", password: "x", role: "platform.owner" },
  ]) {
    assert.equal(validLoginBody(input), false);
  }
});

test("six-digit TOTP including a leading zero is accepted", () => {
  assert.equal(
    validVerificationBody({ method: "totp", totpCode: "012345" }),
    true,
  );
});

test("mixed MFA proofs, bearer challenges and unsupported methods are rejected", () => {
  for (const input of [
    { method: "totp", totpCode: "12345" },
    { method: "totp", totpCode: "123456", recoveryCode: token },
    { method: "totp", totpCode: "123456", challengeToken: token },
    { method: "email_otp", totpCode: "123456" },
    { method: "email_otp", emailOtpCode: "123456", totpCode: "654321" },
    { method: "email_otp", emailOtpCode: 123456 },
    { method: "totp", totpCode: 123456 },
  ])
    assert.equal(validVerificationBody(input), false);
});

test("email delivery is a CSRF-protected command with bounded retry guidance", () => {
  const delivery = { status: "sent", expiresAt: expiry, retryAfterSeconds: 60 };
  assert.equal(needsCsrf("sendEmailCode"), true);
  assert.deepEqual(
    parseEmailCodeDelivery({ ...delivery, recipient: "private" }),
    delivery,
  );
  for (const retryAfterSeconds of [0, 301, 1.5, "60"])
    assert.equal(
      parseEmailCodeDelivery({ ...delivery, retryAfterSeconds }),
      null,
    );
  assert.equal(
    parseEmailCodeDelivery({ ...delivery, expiresAt: "invalid" }),
    null,
  );
});

test("email verification accepts leading zeros and remains restricted", () => {
  const proof = verificationBody("email_otp", "012345");
  assert.deepEqual(proof, { method: "email_otp", emailOtpCode: "012345" });
  assert.equal(validVerificationBody(proof), true);

  const response = { status: "email_verified", expiresAt: expiry };
  assert.deepEqual(parseVerification(response, "email_otp"), response);
  assert.equal(parseSession(response), null);
  assert.equal(parseVerification(response, "totp"), null);
  assert.equal(
    parseVerification({ ...response, status: "authenticated" }, "email_otp"),
    null,
  );
});

test("the verified recovery-code format is supported without TOTP substitution", () => {
  assert.equal(
    validVerificationBody({
      method: "recovery_code",
      recoveryCode: "ABCD-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD-ABCD",
    }),
    true,
  );
  assert.equal(
    validVerificationBody({ method: "recovery_code", recoveryCode: "123456" }),
    false,
  );
});

test("password success remains MFA pending and secret fields are stripped", () => {
  const challenge = parseChallenge({
    status: "MFA_REQUIRED",
    nextStep: "VERIFY_MFA",
    expiresAt: expiry,
    methods: ["totp"],
    csrfToken: token,
    challengeToken: token,
  });
  assert.deepEqual(challenge, {
    status: "MFA_REQUIRED",
    nextStep: "VERIFY_MFA",
    expiresAt: expiry,
    methods: ["totp"],
  });
  assert.equal(parseSession(challenge), null);
});

test("malformed challenges cannot advance the UI", () => {
  for (const input of [
    { status: "authenticated", expiresAt: expiry, methods: ["totp"] },
    {
      status: "MFA_REQUIRED",
      nextStep: "VERIFY_MFA",
      expiresAt: expiry,
      methods: [],
    },
    {
      status: "MFA_REQUIRED",
      nextStep: "VERIFY_MFA",
      expiresAt: expiry,
      methods: ["unknown"],
    },
  ])
    assert.equal(parseChallenge(input), null);
});

test("recovery verification stays restricted and does not become a session", () => {
  const result = parseVerification(
    { status: "mfa_recovery_required", expiresAt: expiry, csrfToken: token },
    "recovery_code",
  );
  assert.deepEqual(result, {
    status: "mfa_recovery_required",
    expiresAt: expiry,
  });
  assert.equal(parseSession(result), null);
});

test("full MFA response still requires the separate session endpoint", () => {
  const result = parseVerification(
    { status: "authenticated", expiresAt: expiry },
    "totp",
  );
  assert.equal(parseSession(result), null);
  assert.equal(
    parseVerification({ status: "success", expiresAt: expiry }, "totp"),
    null,
  );
});

test("session parser requires full MFA and strips roles, IDs and unexpected credentials", () => {
  assert.deepEqual(parseSession({ ...session, sessionToken: token }), {
    displayName: session.displayName,
    email: session.email,
    expiresAt: expiry,
    permissions: session.permissions,
  });
  assert.equal(parseSession({ ...session, mfaVerified: false }), null);
  assert.equal(parseSession({ ...session, authenticated: false }), null);
  assert.equal(
    parseSession({ ...session, permissions: "platform.owner" }),
    null,
  );
});

test("session response classification distinguishes denial, expiration and connection failure", () => {
  const publicSession = parseSession(session);
  assert.equal(sessionResult(200, publicSession).kind, "authenticated");
  assert.equal(sessionResult(401, null).kind, "unauthenticated");
  assert.equal(sessionResult(403, null).kind, "denied");
  assert.equal(sessionResult(0, null).kind, "unavailable");
  assert.equal(sessionResult(503, null).kind, "unavailable");
  assert.equal(sessionResult(200, {}).kind, "unavailable");
  assert.equal(
    sessionResult(200, { ...publicSession, expiresAt: "2000-01-01T00:00:00Z" })
      .kind,
    "unauthenticated",
  );
});

for (const next of [
  "https://evil.example",
  "//evil.example",
  "/\\evil.example",
  "javascript:alert(1)",
  "/%2f%2fevil.example",
  "/login",
  "/organizations",
  ["/"],
  null,
  undefined,
]) {
  test(`unapproved destination falls back to the authorized account landing: ${JSON.stringify(next)}`, () => {
    assert.equal(safeDestination(next), "/");
  });
}

test("problem parsing never renders backend SQL, stacks or rejected values", () => {
  const problem = safeProblem(
    401,
    {
      detail: "SQL secret trace",
      stack: token,
      password: token,
      code: "PLATFORM_AUTHENTICATION_FAILED",
      requestId: "req_synthetic-123",
    },
    "login",
  );
  assert.equal(
    problem.message,
    "Unable to sign in with the provided credentials.",
  );
  assert.equal(problem.requestId, "req_synthetic-123");
  assert.equal(JSON.stringify(problem).includes("SQL"), false);
  assert.equal(JSON.stringify(problem).includes(token), false);
});

test("rate limits have no invented countdown and network failures are not invalid credentials", () => {
  assert.equal(
    safeProblem(429, { retryAfter: 1 }, "login").message,
    "Too many attempts. Please wait before trying again.",
  );
  assert.notEqual(
    safeProblem(503, null, "login").message,
    safeProblem(401, null, "login").message,
  );
  assert.equal(
    safeProblem(403, { requestId: "<script>bad</script>" }, "session")
      .requestId,
    undefined,
  );
  assert.equal(
    safeProblem(503, { code: "INTERNAL_DATABASE_SECRET" }, "session").code,
    "SERVICE_UNAVAILABLE",
  );
});

test("development origins match the canonical API examples", () => {
  assert.deepEqual(
    authConfig("http://localhost:4000", "http://localhost:3000", false),
    {
      adminOrigin: "http://localhost:4000",
      apiOrigin: "http://localhost:3000",
      secure: false,
    },
  );
});

for (const [admin, api, production] of [
  [undefined, "http://localhost:3000", false],
  ["http://admin.example.com", "http://api.example.com", true],
  [origin + "/path", "https://api.example.com", true],
  [origin, origin, true],
  ["https://user:pass@admin.example.com", "https://api.example.com", true],
  ["https://admin.example.com.", "https://api.example.com", true],
]) {
  test(`unsafe or missing origin configuration fails closed: ${String(admin)}`, () => {
    assert.throws(() => authConfig(admin, api, production));
  });
}

test("mutation Origin validation rejects missing, foreign and forwarded-host substitutions", () => {
  assert.equal(
    browserOriginAllowed(new Headers({ origin }), origin, true),
    true,
  );
  assert.equal(browserOriginAllowed(new Headers(), origin, true), false);
  assert.equal(
    browserOriginAllowed(
      new Headers({
        origin: "https://evil.example",
        "x-forwarded-host": "admin.example.com",
      }),
      origin,
      true,
    ),
    false,
  );
  assert.equal(
    browserOriginAllowed(
      new Headers({ origin, "sec-fetch-site": "cross-site" }),
      origin,
      true,
    ),
    false,
  );
});

test("session GET accepts same-origin browser metadata without trusting Host", () => {
  assert.equal(
    browserOriginAllowed(
      new Headers({ "sec-fetch-site": "same-origin" }),
      origin,
      false,
    ),
    true,
  );
  assert.equal(
    browserOriginAllowed(
      new Headers({ host: "admin.example.com" }),
      origin,
      false,
    ),
    false,
  );
});

test("incoming cookies exclude organization and unrelated application credentials", () => {
  const input = `organization-session=secret; __Host-akiba-platform-session=${token}; unrelated=secret; __Host-akiba-platform-csrf=${token}`;
  const result = platformCookies(input, true);
  assert.equal(result.csrf, token);
  assert.equal(result.header.includes("organization-session"), false);
  assert.equal(result.header.includes("unrelated"), false);
  assert.throws(() =>
    platformCookies(
      `__Host-akiba-platform-session=${token}; __Host-akiba-platform-session=${token}`,
      true,
    ),
  );
});

function cookie(name, { httpOnly = true, secure = true, value = token } = {}) {
  return `${name}=${value}; Path=/; Expires=Thu, 01 Jan 2099 00:00:00 GMT; SameSite=Strict${httpOnly ? "; HttpOnly" : ""}${secure ? "; Secure" : ""}`;
}

test("upstream session cookies retain host-only, Secure, HttpOnly and Strict attributes", () => {
  const value = cookie(cookieNames(true).session);
  assert.deepEqual(approvedSetCookies([value], true), [value]);
});

test("only the CSRF cookie may be readable by JavaScript", () => {
  const names = cookieNames(true);
  assert.deepEqual(
    approvedSetCookies([cookie(names.csrf, { httpOnly: false })], true).length,
    1,
  );
  assert.throws(() =>
    approvedSetCookies([cookie(names.session, { httpOnly: false })], true),
  );
  assert.throws(() => approvedSetCookies([cookie(names.csrf)], true));
});

test("signed challenge cookies are relayed without extracting bearer credentials", () => {
  const value = cookie(cookieNames(true).challenge, {
    value: `v1.${token}.${"a".repeat(64)}`,
  });
  assert.deepEqual(approvedSetCookies([value], true), [value]);
});

test("unsafe cookie scope, prefix, flags, duplicates and attributes are rejected", () => {
  const safe = cookie(cookieNames(true).session);
  for (const values of [
    [safe + "; Domain=example.com"],
    [safe.replace("Path=/", "Path=/api")],
    [safe.replace("SameSite=Strict", "SameSite=None")],
    [safe.replace("; Secure", "")],
    [safe, safe],
    [cookie("organization-session")],
    [cookie(cookieNames(true).session, { value: "short" })],
    [safe + "\r\nX-Injected: secret"],
  ])
    assert.throws(() => approvedSetCookies(values, true));
});

test("development cookies are supported without weakening production cookies", () => {
  const value = cookie(cookieNames(false).session, { secure: false });
  assert.deepEqual(approvedSetCookies([value], false), [value]);
  assert.throws(() => approvedSetCookies([value], true));
});

test("expired empty cookies are allowed for backend logout and challenge clearing", () => {
  const clear = `${cookieNames(true).session}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`;
  assert.deepEqual(approvedSetCookies([clear], true), [clear]);
  assert.throws(() =>
    approvedSetCookies(
      [cookie(cookieNames(true).session, { value: "" })],
      true,
    ),
  );
});
