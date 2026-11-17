import assert from "node:assert/strict";
import test from "node:test";
import {
  lifecycleAvailability,
  suspendOrganization,
  suspensionRequest,
  ORGANIZATIONS_ACTIVATE,
  ORGANIZATIONS_SUSPEND,
} from "../src/lib/organizations/lifecycle.ts";
import {
  ORGANIZATIONS_READ,
  parseOrganizationSave,
} from "../src/lib/organizations/contracts.ts";

const row = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Synthetic organization",
  slug: "synthetic",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T01:00:00.000Z",
  activatedAt: "2026-01-01T00:30:00.000Z",
  suspendedAt: null,
  archivedAt: null,
};
const target = { id: row.id, updatedAt: row.updatedAt };
const suspended = {
  ...row,
  status: "SUSPENDED",
  updatedAt: "2026-01-01T02:00:00.000Z",
  suspendedAt: "2026-01-01T02:00:00.000Z",
};
function setup(overrides = {}) {
  const writes = [];
  const reads = [];
  const services = {
    verifyRequest: async () => true,
    session: async () => ({
      kind: "authenticated",
      session: { permissions: [ORGANIZATIONS_READ, ORGANIZATIONS_SUSPEND] },
    }),
    read: async (id) => {
      reads.push(id);
      return { status: 200, body: row };
    },
    suspend: async (...args) => {
      writes.push(args);
      return { status: 200, body: suspended };
    },
    ...overrides,
  };
  return { services, writes, reads };
}

test("only active organizations with suspension permission offer suspension", () => {
  for (const status of ["PENDING", "ACTIVE", "SUSPENDED", "ARCHIVED"]) {
    assert.equal(
      lifecycleAvailability(status, [ORGANIZATIONS_SUSPEND]).canSuspend,
      status === "ACTIVE",
    );
    assert.equal(
      lifecycleAvailability(status, [ORGANIZATIONS_READ]).canSuspend,
      false,
    );
  }
  assert.match(
    lifecycleAvailability("PENDING", [ORGANIZATIONS_ACTIVATE]).unavailable,
    /unavailable/,
  );
  assert.match(
    lifecycleAvailability("SUSPENDED", [ORGANIZATIONS_ACTIVATE]).unavailable,
    /unavailable/,
  );
  assert.equal(
    lifecycleAvailability("ARCHIVED", [ORGANIZATIONS_ACTIVATE]).unavailable,
    null,
  );
});

test("suspension uses the actual POST path and exact timestamp-only DTO", () => {
  assert.deepEqual(suspensionRequest(target), {
    path: `/api/v1/platform/organizations/${row.id}/suspension`,
    method: "POST",
    body: { expectedUpdatedAt: row.updatedAt },
  });
  assert.throws(() => suspensionRequest({ ...target, id: "../other" }));
});

test("a current active organization is suspended once and only a verified result succeeds", async () => {
  const { services, writes } = setup();
  assert.deepEqual(await suspendOrganization(target, services), {
    kind: "success",
    organization: suspended,
  });
  assert.deepEqual(writes, [[row.id, row.updatedAt]]);
});

for (const input of [
  null,
  {},
  { ...target, status: "ACTIVE" },
  { ...target, action: "activation" },
  { ...target, id: "../other" },
  { ...target, updatedAt: "invalid" },
]) {
  test(`invalid or privileged suspension input is rejected: ${JSON.stringify(input)}`, async () => {
    const { services, writes, reads } = setup();
    assert.equal((await suspendOrganization(input, services)).kind, "error");
    assert.equal(writes.length + reads.length, 0);
  });
}

for (const session of [
  { kind: "unauthenticated" },
  { kind: "denied" },
  { kind: "unavailable" },
  { kind: "authenticated", session: { permissions: [ORGANIZATIONS_READ] } },
  { kind: "authenticated", session: { permissions: [ORGANIZATIONS_SUSPEND] } },
]) {
  test(`session and permission checks reject unauthorized suspension: ${JSON.stringify(session)}`, async () => {
    const { services, reads, writes } = setup({ session: async () => session });
    const result = await suspendOrganization(target, services);
    assert.equal(
      result.kind,
      session.kind === "unauthenticated" ? "unauthenticated" : "error",
    );
    assert.equal(reads.length + writes.length, 0);
  });
}

test("invalid Origin or missing CSRF prevents reads and writes", async () => {
  const { services, reads, writes } = setup({
    verifyRequest: async () => false,
  });
  assert.equal(
    (await suspendOrganization(target, services)).problem.status,
    403,
  );
  assert.equal(reads.length + writes.length, 0);
});

for (const current of [
  { ...row, status: "PENDING" },
  { ...row, status: "SUSPENDED" },
  { ...row, status: "ARCHIVED" },
  { ...row, updatedAt: suspended.updatedAt },
  { ...row, id: "22222222-2222-4222-8222-222222222222" },
]) {
  test(`live state rejects stale or ineligible suspension: ${current.status}/${current.updatedAt}/${current.id}`, async () => {
    const { services, writes } = setup({
      read: async () => ({ status: 200, body: current }),
    });
    const result = await suspendOrganization(target, services);
    assert.equal(result.kind, "error");
    assert.equal(result.refreshRequired, true);
    assert.equal(writes.length, 0);
  });
}

for (const status of [400, 401, 403, 404, 409, 412, 429, 503]) {
  test(`mutation status ${status} stays safe and is never retried`, async () => {
    let writes = 0;
    const { services } = setup({
      suspend: async () => {
        writes++;
        return {
          status,
          body: { detail: "Prisma SQL secret", requestId: "req_safe" },
        };
      },
    });
    const result = await suspendOrganization(target, services);
    assert.equal(result.kind, status === 401 ? "unauthenticated" : "error");
    assert.equal(JSON.stringify(result).includes("Prisma"), false);
    assert.equal(writes, 1);
    if (result.kind === "error") assert.equal(result.refreshRequired, true);
  });
}

test("a timeout is uncertain and never automatically retried", async () => {
  let writes = 0;
  const { services } = setup({
    suspend: async () => {
      writes++;
      throw new Error("secret diagnostics");
    },
  });
  const result = await suspendOrganization(target, services);
  assert.equal(result.kind, "error");
  assert.equal(result.refreshRequired, true);
  assert.equal(writes, 1);
  assert.equal(JSON.stringify(result).includes("secret diagnostics"), false);
});

test("read-side expiration and denial cannot reach a lifecycle write", async () => {
  for (const status of [401, 403, 404, 503]) {
    const { services, writes } = setup({
      read: async () => ({ status, body: {} }),
    });
    assert.equal(
      (await suspendOrganization(target, services)).kind,
      status === 401 ? "unauthenticated" : "error",
    );
    assert.equal(writes.length, 0);
  }
});

test("two concurrent requests respect the API's winner and stale-version rejection", async () => {
  let calls = 0;
  const { services } = setup({
    suspend: async () =>
      ++calls === 1
        ? { status: 200, body: suspended }
        : {
            status: 412,
            body: { code: "ORGANIZATION_STALE", detail: "private diagnostic" },
          },
  });
  const results = await Promise.all([
    suspendOrganization(target, services),
    suspendOrganization(target, services),
  ]);
  assert.equal(results.filter((result) => result.kind === "success").length, 1);
  const rejected = results.find((result) => result.kind === "error");
  assert.equal(rejected.problem.code, "ORGANIZATION_STALE");
  assert.equal(rejected.refreshRequired, true);
  assert.equal(JSON.stringify(results).includes("private diagnostic"), false);
  assert.equal(calls, 2);
});

for (const response of [
  { status: 200, body: row },
  {
    status: 200,
    body: { ...suspended, id: "22222222-2222-4222-8222-222222222222" },
  },
  { status: 200, body: { ...suspended, updatedAt: row.updatedAt } },
  { status: 200, body: suspended, cookieCount: 1 },
]) {
  test(`unconfirmed mutation response is rejected: ${JSON.stringify(response)}`, async () => {
    const { services } = setup({ suspend: async () => response });
    assert.equal((await suspendOrganization(target, services)).kind, "error");
  });
}

test("registration success requires the submitted name, slug and pending state", () => {
  const expected = { name: row.name, slug: row.slug };
  assert.ok(parseOrganizationSave({ ...row, status: "PENDING" }, expected));
  for (const body of [
    row,
    { ...row, status: "PENDING", name: "Different" },
    { ...row, status: "PENDING", slug: "different" },
  ])
    assert.equal(parseOrganizationSave(body, expected), null);
});

test("edit success requires the selected organization and an advanced version", () => {
  const expected = { name: row.name, id: row.id, updatedAt: row.updatedAt };
  assert.ok(parseOrganizationSave(suspended, expected));
  assert.equal(parseOrganizationSave(row, expected), null);
  assert.equal(
    parseOrganizationSave(
      { ...suspended, id: "22222222-2222-4222-8222-222222222222" },
      expected,
    ),
    null,
  );
});

test("suspension cannot confirm unrelated lifecycle timestamp changes", async () => {
  for (const body of [
    { ...suspended, createdAt: suspended.updatedAt },
    { ...suspended, activatedAt: suspended.updatedAt },
    { ...suspended, archivedAt: suspended.updatedAt },
    { ...suspended, suspendedAt: "2026-01-01T03:00:00.000Z" },
  ]) {
    const { services } = setup({
      suspend: async () => ({ status: 200, body }),
    });
    assert.equal((await suspendOrganization(target, services)).kind, "error");
  }
});
