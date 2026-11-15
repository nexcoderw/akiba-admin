import assert from "node:assert/strict";
import test from "node:test";
import { ENROLLMENT_PATHS, needsCsrf, validEnrollmentBody, parseEnrollmentState, parseEnrollmentSetup, parseEnrollmentComplete, safeProblem } from "../src/lib/auth/contracts.ts";

test("enrollment exposes only six fixed POST capabilities", () => {
  assert.equal(Object.keys(ENROLLMENT_PATHS).length, 6);
  for (const [operation, path] of Object.entries(ENROLLMENT_PATHS)) {
    assert.match(path, /^\/api\/v1\/platform\/bootstrap\/enrollment\/(exchange|status|password|setup|complete|cancel)$/u);
    assert.equal(needsCsrf(operation), operation !== "enrollmentExchange");
  }
});

test("enrollment rejects arbitrary IDs, roles, extra proofs and malformed input", () => {
  assert.equal(validEnrollmentBody("enrollmentExchange", { token: "a".repeat(43) }), true);
  assert.equal(validEnrollmentBody("enrollmentExchange", { token: "a".repeat(43), userId: "other" }), false);
  assert.equal(validEnrollmentBody("enrollmentComplete", { code: "012345", version: 1 }), true);
  assert.equal(validEnrollmentBody("enrollmentComplete", { code: "012345", version: 1, role: "platform.owner" }), false);
  assert.equal(validEnrollmentBody("enrollmentComplete", { code: "012345", version: 0 }), false);
  assert.equal(validEnrollmentBody("enrollmentSetup", { organizationId: "other" }), false);
  assert.equal(validEnrollmentBody("enrollmentSetup", {}), true);
  assert.equal(validEnrollmentBody("enrollmentCancel", null), false);
});

test("new passwords enforce character and byte bounds without trimming", () => {
  assert.equal(validEnrollmentBody("enrollmentPassword", { password: "  a unique long passphrase  " }), true);
  for (const password of ["short", "x".repeat(1025), "é".repeat(2049), "\ud800".repeat(20), "a long password\nwith control"]) {
    assert.equal(validEnrollmentBody("enrollmentPassword", { password }), false);
  }
});

test("enrollment responses cannot be interpreted as a full authenticated session", () => {
  assert.equal(parseEnrollmentState({ authenticated: true, token: "secret" }), null);
  assert.equal(parseEnrollmentState({ stage: "active", expiresAt: "2099-01-01" }), null);
  assert.deepEqual(parseEnrollmentState({ stage: "password", expiresAt: "2099-01-01", token: "must-not-forward" }), { stage: "password", expiresAt: "2099-01-01" });
  assert.equal(parseEnrollmentSetup({ secret: "secret", version: 1 }), null);
  assert.deepEqual(parseEnrollmentSetup({ secret: "A".repeat(32), version: 1, encryptedSecret: "hidden" }), { secret: "A".repeat(32), version: 1 });
});

test("one-time recovery disclosure requires ten distinct correctly formed codes", () => {
  const codes = Array.from({ length: 10 }, (_, index) => index.toString(16).toUpperCase().padStart(32, "A").match(/.{4}/gu).join("-"));
  assert.deepEqual(parseEnrollmentComplete({ recoveryCodes: codes, sessionToken: "never-forward" }), { recoveryCodes: codes });
  assert.equal(parseEnrollmentComplete({ recoveryCodes: Array(10).fill(codes[0]) }), null);
  assert.equal(parseEnrollmentComplete({ recoveryCodes: ["plaintext secret"] }), null);
});

test("enrollment errors discard backend messages and offer safe recovery", () => {
  const problem = safeProblem(401, { code: "PLATFORM_BOOTSTRAP_ENROLLMENT_INVALID", detail: "private SQL and owner identity" }, "enrollmentStatus");
  assert.match(problem.message, /operator/u);
  assert.doesNotMatch(JSON.stringify(problem), /SQL|private/u);
});
