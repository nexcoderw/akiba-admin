import assert from "node:assert/strict";
import test from "node:test";
import {
  organizationApiPath,
  organizationListHref,
  organizationProblem,
  organizationReturnHref,
  organizationStatuses,
  pageLinks,
  parseOrganization,
  parseOrganizationPage,
  parseOrganizationQuery,
  validOrganizationId,
} from "../src/lib/organizations/contracts.ts";
import {
  readOrganizationDetail,
  readOrganizationList,
} from "../src/lib/organizations/reader.ts";

const id = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const row = {
  id,
  name: "Synthetic Organization",
  slug: "synthetic-organization",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T01:00:00.000Z",
  activatedAt: "2026-01-01T01:00:00.000Z",
  suspendedAt: null,
  archivedAt: null,
};

test("organization DTO accepts every actual lifecycle status and strips unrelated fields", () => {
  for (const status of organizationStatuses) {
    assert.deepEqual(
      parseOrganization({ ...row, status, secret: "must not cross boundary" }),
      { ...row, status },
    );
  }
});
test("malformed records never become organization data", () => {
  for (const change of [
    { id: "../auth/me" },
    { name: "" },
    { name: "x".repeat(161) },
    { slug: "Unsafe.Example" },
    { status: "APPROVED" },
    { createdAt: "invalid" },
    { updatedAt: null },
    { activatedAt: undefined },
  ])
    assert.equal(parseOrganization({ ...row, ...change }), null);
});
test("empty results remain distinct from malformed or failed responses", () => {
  assert.deepEqual(parseOrganizationPage({ items: [], nextCursor: null }, 20), {
    items: [],
    nextCursor: null,
  });
  for (const value of [
    null,
    {},
    { items: [], nextCursor: id },
    { items: [row], nextCursor: "unsafe" },
  ])
    assert.equal(parseOrganizationPage(value, 20), null);
});
test("pagination rejects duplicate rows, oversized pages and inconsistent cursors", () => {
  assert.equal(
    parseOrganizationPage({ items: [row, row], nextCursor: null }, 20),
    null,
  );
  assert.equal(
    parseOrganizationPage(
      { items: [row, { ...row, id: secondId }], nextCursor: null },
      1,
    ),
    null,
  );
  assert.equal(
    parseOrganizationPage({ items: [row], nextCursor: secondId }, 1),
    null,
  );
  assert.deepEqual(parseOrganizationPage({ items: [row], nextCursor: id }, 1), {
    items: [row],
    nextCursor: id,
  });
});
test("list query validates supported limits, statuses and cursor selectors", () => {
  assert.deepEqual(parseOrganizationQuery({}), {
    limit: 20,
    status: undefined,
    cursor: undefined,
    previous: [],
  });
  assert.equal(
    parseOrganizationQuery({ status: "ARCHIVED", limit: "50" }).status,
    "ARCHIVED",
  );
  for (const params of [
    { limit: "51" },
    { limit: "0" },
    { limit: "20.0" },
    { limit: "1e1" },
    { status: "APPROVED" },
    { status: ["ACTIVE", "PENDING"] },
    { cursor: "https://attacker.invalid" },
    { search: "unsupported" },
    { approvedBy: id },
    { previous: "first" },
  ])
    assert.equal(parseOrganizationQuery(params), null);
});
test("Next and Previous preserve filters and return to the original first page", () => {
  const initial = parseOrganizationQuery({ status: "SUSPENDED", limit: "10" });
  const first = organizationListHref(initial);
  const next = pageLinks(initial, id).next;
  const nextQuery = parseOrganizationQuery(
    Object.fromEntries(new URL(next, "https://internal.invalid").searchParams),
  );
  assert.equal(nextQuery.cursor, id);
  assert.equal(nextQuery.status, "SUSPENDED");
  assert.equal(nextQuery.limit, 10);
  assert.equal(pageLinks(nextQuery, null).previous, first);
  assert.equal(pageLinks(nextQuery, null).next, null);
});
test("cursor history stays bounded and is never sent to the backend", () => {
  const query = {
    limit: 20,
    status: "PENDING",
    cursor: id,
    previous: Array(20).fill("first"),
  };
  const next = pageLinks(query, secondId).next;
  const params = Object.fromEntries(
    new URL(next, "https://internal.invalid").searchParams,
  );
  assert.equal(parseOrganizationQuery(params).previous.length, 20);
  assert.equal(
    organizationApiPath({ kind: "list", query }),
    `/api/v1/platform/organizations?limit=20&status=PENDING&cursor=${id}`,
  );
});
test("detail paths accept UUID selectors and reject traversal or arbitrary upstream paths", () => {
  assert.equal(
    organizationApiPath({ kind: "detail", id }),
    `/api/v1/platform/organizations/${id}`,
  );
  for (const value of [
    "../auth/me",
    "//evil.invalid",
    "invalid",
    "",
    `${id}/roles`,
  ]) {
    assert.equal(validOrganizationId(value), false);
    assert.throws(() => organizationApiPath({ kind: "detail", id: value }));
  }
});
test("back links retain only validated list state and reject redirects", () => {
  const from = `/organizations?limit=20&status=ACTIVE&cursor=${id}&previous=first`;
  assert.equal(organizationReturnHref(from), from);
  for (const value of [
    "https://evil.invalid",
    "//evil.invalid",
    "/login",
    "/organizations?status=ACTIVE&status=PENDING",
    "/organizations?next=https://evil.invalid",
    "/organizations?limit=20#secret",
  ])
    assert.equal(organizationReturnHref(value), "/organizations");
});
test("errors preserve safe request IDs and distinguish authentication, access denial and absence", () => {
  const source = {
    detail: "SQL secret",
    message: "Prisma secret",
    requestId: "req_synthetic",
  };
  for (const status of [400, 401, 403, 404, 429, 500, 502, 503]) {
    const problem = organizationProblem(status, source);
    assert.equal(problem.status, status);
    assert.equal(problem.requestId, "req_synthetic");
    assert.doesNotMatch(problem.message, /SQL|Prisma|secret/u);
  }
  assert.match(organizationProblem(401).message, /Sign in/u);
  assert.match(organizationProblem(403).message, /permission/u);
  assert.match(organizationProblem(404).message, /could not be found/u);
});

const session = {
  kind: "authenticated",
  session: {
    displayName: "Synthetic Administrator",
    email: "admin@example.com",
    expiresAt: "2099-01-01T00:00:00.000Z",
    permissions: ["platform.organizations.read"],
  },
};
const query = { limit: 20, previous: [] };

test("unauthenticated and unauthorized principals never fetch organization records", async () => {
  for (const principal of [
    { kind: "unauthenticated" },
    {
      ...session,
      session: {
        ...session.session,
        permissions: ["organization.memberships.read"],
      },
    },
    { kind: "denied", problem: organizationProblem(403) },
  ]) {
    let requested = false;
    const result = await readOrganizationList(query, {
      session: async () => principal,
      request: async () => {
        requested = true;
        throw new Error("must not fetch");
      },
    });
    assert.equal(requested, false);
    assert.equal(
      result.kind,
      principal.kind === "unauthenticated" ? "unauthenticated" : "error",
    );
  }
});
test("list reads use the requested query and return validated response fields", async () => {
  const result = await readOrganizationList(query, {
    session: async () => session,
    request: async (target) => {
      assert.deepEqual(target, { kind: "list", query });
      return { status: 200, body: { items: [row], nextCursor: null } };
    },
  });
  assert.deepEqual(result, {
    kind: "success",
    data: { items: [row], nextCursor: null },
  });
});
test("detail reads cannot present a record from a different organization", async () => {
  for (const returned of [row, { ...row, id: secondId }]) {
    const result = await readOrganizationDetail(id, {
      session: async () => session,
      request: async (target) => {
        assert.deepEqual(target, { kind: "detail", id });
        return { status: 200, body: returned };
      },
    });
    assert.equal(result.kind, returned.id === id ? "success" : "error");
  }
});
test("server 401 expires the session while other failures remain safe error states", async () => {
  for (const status of [401, 403, 404, 429, 500]) {
    const result = await readOrganizationDetail(id, {
      session: async () => session,
      request: async () => ({ status, body: { detail: "SQL secret" } }),
    });
    assert.equal(result.kind, status === 401 ? "unauthenticated" : "error");
    if (result.kind === "error")
      assert.doesNotMatch(result.problem.message, /SQL|secret/u);
  }
});
test("network failures do not log out a valid session or fabricate an empty page", async () => {
  const result = await readOrganizationList(query, {
    session: async () => session,
    request: async () => {
      throw new Error("private internal address");
    },
  });
  assert.equal(result.kind, "error");
  assert.equal(result.problem.status, 503);
  assert.doesNotMatch(result.problem.message, /private|address/u);
});
test("archived records are accepted only for the explicit archived filter", async () => {
  const services = {
    session: async () => session,
    request: async () => ({
      status: 200,
      body: { items: [{ ...row, status: "ARCHIVED" }], nextCursor: null },
    }),
  };
  assert.equal((await readOrganizationList(query, services)).kind, "error");
  assert.equal(
    (await readOrganizationList({ ...query, status: "ARCHIVED" }, services))
      .kind,
    "success",
  );
});
