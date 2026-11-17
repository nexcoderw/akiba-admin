import assert from "node:assert/strict";
import test from "node:test";
import {
  OWNER_PERMISSIONS,
  invitationRequest,
  normalizeInvitationEmail,
  ownerInvitationAvailability,
  parseInvitationCommand,
  parseInvitationPage,
  parseOwnerInvitation,
  validateOwnerInvite,
} from "../src/lib/organizations/owner-invitations.ts";
import { runOwnerInvitation } from "../src/lib/organizations/owner-invitation-service.ts";
import { ORGANIZATIONS_READ } from "../src/lib/organizations/contracts.ts";

const organizationId = "11111111-1111-4111-8111-111111111111";
const invitationId = "22222222-2222-4222-8222-222222222222";
const otherId = "33333333-3333-4333-8333-333333333333";
const organization = {
  id: organizationId,
  name: "Synthetic organization",
  slug: "synthetic",
  status: "PENDING",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T01:00:00.000Z",
  activatedAt: null,
  suspendedAt: null,
  archivedAt: null,
};
const invitation = {
  id: invitationId,
  organizationId,
  displayName: "Synthetic Owner",
  email: "owner@example.com",
  status: "PENDING_DELIVERY",
  deliveryStatus: null,
  createdAt: organization.createdAt,
  updatedAt: organization.updatedAt,
  sentAt: null,
  expiresAt: null,
  acceptedAt: null,
  revokedAt: null,
};
const list = { operation: "list", organizationId };
const create = {
  operation: "create",
  organizationId,
  displayName: invitation.displayName,
  email: invitation.email,
};
const revoke = { operation: "revoke", organizationId, invitationId };
const delivery = { operation: "delivery", organizationId, invitationId };
const revoked = {
  ...invitation,
  status: "REVOKED",
  updatedAt: "2026-01-01T02:00:00.000Z",
  revokedAt: "2026-01-01T02:00:00.000Z",
};
const allPermissions = [
  ORGANIZATIONS_READ,
  ...Object.values(OWNER_PERMISSIONS),
];

function setup(overrides = {}) {
  const requests = [];
  const scopes = [];
  const services = {
    verifyRequest: async () => true,
    session: async () => ({
      kind: "authenticated",
      session: { permissions: allPermissions },
    }),
    organization: async (id) => {
      scopes.push(id);
      return { status: 200, body: organization };
    },
    request: async (command) => {
      requests.push(command);
      if (command.operation === "list")
        return { status: 200, body: { items: [invitation], nextCursor: null } };
      if (command.operation === "create")
        return { status: 201, body: invitation };
      if (command.operation === "revoke") return { status: 200, body: revoked };
      return {
        status: 202,
        body: { status: "QUEUED", message: "untrusted provider text" },
      };
    },
    ...overrides,
  };
  return { services, requests, scopes };
}

test("owner email validation follows canonical identity rules", () => {
  assert.equal(
    normalizeInvitationEmail(" Owner+Tag@EXAMPLE.COM "),
    "owner+tag@example.com",
  );
  assert.equal(
    normalizeInvitationEmail("owner@bücher.example"),
    "owner@xn--bcher-kva.example",
  );
  assert.equal(
    normalizeInvitationEmail("owner.name@example.com"),
    "owner.name@example.com",
  );
  for (const email of [
    null,
    "",
    "a@@example.com",
    "a b@example.com",
    "a..b@example.com",
    "a@localhost",
    "a@127.0.0.1",
    "a@example.com.",
    "用户@example.com",
    "a@exa_mple.com",
    "a@%65xample.com",
    "a".repeat(65) + "@example.com",
  ])
    assert.equal(normalizeInvitationEmail(email), null);
  assert.ok(validateOwnerInvite(" ", "bad").displayName);
  assert.ok(validateOwnerInvite("Owner", "bad").email);
  assert.ok(
    validateOwnerInvite("a".repeat(161), "owner@example.com").displayName,
  );
});

test("only verified endpoints and exact DTO fields reach transport", () => {
  assert.deepEqual(invitationRequest(create), {
    path: `/api/v1/platform/organizations/${organizationId}/owner-invitations`,
    method: "POST",
    body: { displayName: invitation.displayName, email: invitation.email },
  });
  assert.equal(invitationRequest(list).path.endsWith("?limit=20"), true);
  assert.equal(
    invitationRequest(revoke).path.endsWith(`/${invitationId}/revocation`),
    true,
  );
  assert.equal(
    invitationRequest(delivery).path.endsWith(`/${invitationId}/delivery`),
    true,
  );
  assert.deepEqual(invitationRequest(delivery).body, {});
  assert.deepEqual(invitationRequest(revoke).body, {});
  for (const command of [
    { ...create, role: "OWNER" },
    { ...create, token: "secret" },
    { ...create, organizationId: "../other" },
    { ...revoke, actorId: otherId },
    { ...delivery, email: "other@example.com" },
    { ...list, limit: 1000 },
    { ...list, cursor: "../other" },
    { ...list, operation: "resend" },
  ])
    assert.equal(parseInvitationCommand(command), null);
});

test("listing validates organization binding and strips secret material", () => {
  const record = parseOwnerInvitation(
    {
      ...invitation,
      token: "SECRET",
      tokenDigest: "DIGEST",
      acceptanceUrl: "secret-link",
    },
    organizationId,
  );
  assert.deepEqual(record, invitation);
  assert.equal(
    parseOwnerInvitation(
      { ...invitation, organizationId: otherId },
      organizationId,
    ),
    null,
  );
  assert.equal(
    parseInvitationPage({ items: [], nextCursor: null }, organizationId).items
      .length,
    0,
  );
  assert.equal(
    parseInvitationPage(
      { items: [invitation, invitation], nextCursor: null },
      organizationId,
    ),
    null,
  );
  assert.equal(
    parseInvitationPage(
      { items: [invitation], nextCursor: invitation.id },
      organizationId,
    ),
    null,
  );
  assert.equal(
    parseInvitationPage(
      { items: Array(21).fill(invitation), nextCursor: null },
      organizationId,
    ),
    null,
  );
  assert.equal(
    parseInvitationPage(
      { items: [invitation], nextCursor: null },
      organizationId,
      invitation.id,
    ),
    null,
  );
  for (const status of ["EXPIRED", "ACTIVE", "UNKNOWN"])
    assert.equal(
      parseOwnerInvitation({ ...invitation, status }, organizationId),
      null,
    );
  assert.equal(
    parseOwnerInvitation({ ...invitation, status: "SENT" }, organizationId),
    null,
  );
  assert.equal(
    parseOwnerInvitation({ ...invitation, status: "ACCEPTED" }, organizationId),
    null,
  );
  assert.equal(parseOwnerInvitation(revoked, organizationId).status, "REVOKED");
});

test("action visibility uses actual permissions and organization/invitation states", () => {
  for (const status of ["PENDING", "ACTIVE", "SUSPENDED", "ARCHIVED"]) {
    const availability = ownerInvitationAvailability(
      status,
      allPermissions,
      invitation,
    );
    assert.equal(availability.create, ["PENDING", "ACTIVE"].includes(status));
    assert.equal(availability.delivery, ["PENDING", "ACTIVE"].includes(status));
    assert.equal(availability.revoke, true);
  }
  assert.equal(
    ownerInvitationAvailability("ACTIVE", [ORGANIZATIONS_READ], invitation)
      .create,
    false,
  );
  assert.equal(
    ownerInvitationAvailability("ACTIVE", [OWNER_PERMISSIONS.read], invitation)
      .create,
    false,
  );
  assert.equal(
    ownerInvitationAvailability("ACTIVE", allPermissions, {
      ...invitation,
      status: "ACCEPTED",
    }).revoke,
    false,
  );
  for (const deliveryStatus of [
    "QUEUED",
    "PROCESSING",
    "CONFIRMED",
    "FAILED",
    "UNCERTAIN",
  ])
    assert.equal(
      ownerInvitationAvailability("PENDING", allPermissions, {
        ...invitation,
        deliveryStatus,
      }).delivery,
      false,
    );
});

for (const command of [list, create, revoke, delivery]) {
  test(`server independently enforces authentication and permission for ${command.operation}`, async () => {
    for (const session of [
      { kind: "unauthenticated" },
      { kind: "denied" },
      { kind: "unavailable" },
      {
        kind: "authenticated",
        session: { permissions: ["organization.members.read"] },
      },
      { kind: "authenticated", session: { permissions: [ORGANIZATIONS_READ] } },
    ]) {
      const { services, requests, scopes } = setup({
        session: async () => session,
      });
      const result = await runOwnerInvitation(command, services);
      assert.equal(
        result.kind,
        session.kind === "unauthenticated" ? "unauthenticated" : "error",
      );
      assert.equal(requests.length + scopes.length, 0);
    }
    if (command.operation !== "list") {
      const { services, requests } = setup({
        session: async () => ({
          kind: "authenticated",
          session: {
            permissions: [ORGANIZATIONS_READ, OWNER_PERMISSIONS.read],
          },
        }),
      });
      assert.equal(
        (await runOwnerInvitation(command, services)).problem.status,
        403,
      );
      assert.equal(requests.length, 0);
    }
    const protectedRequest = setup({ verifyRequest: async () => false });
    assert.equal(
      (await runOwnerInvitation(command, protectedRequest.services)).problem
        .status,
      403,
    );
    assert.equal(
      protectedRequest.requests.length + protectedRequest.scopes.length,
      0,
    );
  });
}

test("create commits only an intended pending-delivery record, without email or owner activation", async () => {
  const { services, requests } = setup();
  const result = await runOwnerInvitation(create, services);
  assert.equal(result.kind, "invitation");
  assert.deepEqual(result.invitation, invitation);
  assert.deepEqual(requests, [create]);
  for (const body of [
    { ...invitation, organizationId: otherId },
    { ...invitation, email: "other@example.com" },
    {
      ...invitation,
      status: "SENT",
      sentAt: invitation.updatedAt,
      expiresAt: revoked.updatedAt,
    },
    { ...invitation, deliveryStatus: "QUEUED" },
  ]) {
    const { services } = setup({
      request: async () => ({ status: 201, body }),
    });
    assert.equal((await runOwnerInvitation(create, services)).kind, "error");
  }
});

test("suspended and archived organizations cannot create invitations or request delivery", async () => {
  for (const status of ["SUSPENDED", "ARCHIVED"])
    for (const command of [create, delivery]) {
      const { services, requests } = setup({
        organization: async () => ({
          status: 200,
          body: { ...organization, status },
        }),
      });
      assert.equal(
        (await runOwnerInvitation(command, services)).problem.status,
        409,
      );
      assert.equal(requests.length, 0);
    }
});

test("revocation remains allowed for outstanding invitations on unavailable organizations", async () => {
  const { services } = setup({
    organization: async () => ({
      status: 200,
      body: { ...organization, status: "SUSPENDED" },
    }),
  });
  assert.equal((await runOwnerInvitation(revoke, services)).kind, "invitation");
});

test("cross-organization selections never reach mutation transport", async () => {
  const { services, requests } = setup({
    organization: async () => ({
      status: 200,
      body: { ...organization, id: otherId },
    }),
  });
  assert.equal((await runOwnerInvitation(create, services)).kind, "error");
  assert.equal(requests.length, 0);
  let writes = 0;
  const scoped = setup({
    request: async (command) => {
      if (command.operation !== "list") writes++;
      return {
        status: 200,
        body: {
          items: [{ ...invitation, organizationId: otherId }],
          nextCursor: null,
        },
      };
    },
  });
  assert.equal(
    (await runOwnerInvitation(revoke, scoped.services)).kind,
    "error",
  );
  assert.equal(writes, 0);
});

test("accepted, revoked and changed invitations cannot be revoked or delivered", async () => {
  for (const item of [
    revoked,
    { ...invitation, status: "ACCEPTED", acceptedAt: revoked.updatedAt },
  ]) {
    let writes = 0;
    const { services } = setup({
      request: async (command) => {
        if (command.operation !== "list") writes++;
        return { status: 200, body: { items: [item], nextCursor: null } };
      },
    });
    for (const command of [revoke, delivery])
      assert.equal((await runOwnerInvitation(command, services)).kind, "error");
    assert.equal(writes, 0);
  }
});

test("delivery reports only the backend reservation status and drops provider text", async () => {
  const { services, requests } = setup();
  assert.deepEqual(await runOwnerInvitation(delivery, services), {
    kind: "delivery",
    status: "QUEUED",
  });
  assert.deepEqual(
    requests.map((command) => command.operation),
    ["list", "delivery"],
  );
  for (const status of ["PROCESSING", "CONFIRMED", "FAILED", "UNCERTAIN"]) {
    const { services } = setup({
      request: async (command) =>
        command.operation === "list"
          ? { status: 200, body: { items: [invitation], nextCursor: null } }
          : {
              status: 202,
              body: {
                status,
                token: "SECRET",
                message: "private provider diagnostic",
              },
            },
    });
    assert.deepEqual(await runOwnerInvitation(delivery, services), {
      kind: "delivery",
      status,
    });
  }
});

for (const status of [400, 401, 403, 404, 409, 410, 429, 503]) {
  test(`mutation error ${status} is safe and never automatically retried`, async () => {
    let writes = 0;
    const { services } = setup({
      request: async () => {
        writes++;
        return {
          status,
          body: {
            code: "OWNER_INVITATION_OUTSTANDING_CONFLICT",
            detail: "SQL Prisma TOKEN",
            token: "secret",
            requestId: "req_safe",
          },
        };
      },
    });
    const result = await runOwnerInvitation(create, services);
    assert.equal(result.kind, status === 401 ? "unauthenticated" : "error");
    assert.equal(JSON.stringify(result).includes("Prisma"), false);
    assert.equal(JSON.stringify(result).includes("secret"), false);
    assert.equal(writes, 1);
    if (result.kind === "error") assert.equal(result.refreshRequired, true);
  });
}

test("a mutation timeout remains uncertain and is never replayed", async () => {
  let calls = 0;
  const { services } = setup({
    request: async () => {
      calls++;
      throw new Error("provider credentials");
    },
  });
  const result = await runOwnerInvitation(create, services);
  assert.equal(result.kind, "error");
  assert.equal(result.refreshRequired, true);
  assert.equal(calls, 1);
  assert.equal(JSON.stringify(result).includes("provider credentials"), false);
});

test("concurrent creation respects the backend conflict without inventing a second success", async () => {
  let calls = 0;
  const { services } = setup({
    request: async () =>
      ++calls === 1
        ? { status: 201, body: invitation }
        : { status: 409, body: {} },
  });
  const results = await Promise.all([
    runOwnerInvitation(create, services),
    runOwnerInvitation(create, services),
  ]);
  assert.equal(
    results.filter((result) => result.kind === "invitation").length,
    1,
  );
  assert.equal(results.filter((result) => result.kind === "error").length, 1);
  assert.equal(calls, 2);
});

test("an existing reservation cannot be used as a resend path", async () => {
  let writes = 0;
  const { services } = setup({
    request: async (command) => {
      if (command.operation !== "list") writes++;
      return {
        status: 200,
        body: {
          items: [{ ...invitation, deliveryStatus: "UNCERTAIN" }],
          nextCursor: null,
        },
      };
    },
  });
  assert.equal(
    (await runOwnerInvitation(delivery, services)).problem.status,
    409,
  );
  assert.equal(writes, 0);
});

test("read failures stay distinct from a verified empty page", async () => {
  const empty = setup({
    request: async () => ({
      status: 200,
      body: { items: [], nextCursor: null },
    }),
  });
  assert.deepEqual(await runOwnerInvitation(list, empty.services), {
    kind: "page",
    page: { items: [], nextCursor: null },
  });
  for (const status of [401, 403, 404, 429, 503]) {
    const { services } = setup({
      request: async () => ({ status, body: { detail: "private SQL" } }),
    });
    const result = await runOwnerInvitation(list, services);
    assert.equal(result.kind, status === 401 ? "unauthenticated" : "error");
    assert.equal(JSON.stringify(result).includes("private SQL"), false);
  }
  const malformed = setup({ request: async () => ({ status: 200, body: {} }) });
  assert.equal(
    (await runOwnerInvitation(list, malformed.services)).kind,
    "error",
  );
});

test("elapsed expiration does not invent a persisted invitation status", () => {
  const sent = {
    ...invitation,
    status: "SENT",
    deliveryStatus: "CONFIRMED",
    sentAt: invitation.createdAt,
    expiresAt: invitation.updatedAt,
  };
  assert.equal(parseOwnerInvitation(sent, organizationId).status, "SENT");
});

test("malformed delivery and unexpected cookies cannot be reported as success", async () => {
  for (const response of [
    { status: 200, body: { status: "QUEUED" } },
    { status: 202, body: { status: "DELIVERED" } },
    { status: 202, body: { status: "QUEUED" }, cookieCount: 1 },
  ]) {
    const { services } = setup({
      request: async (command) =>
        command.operation === "list"
          ? { status: 200, body: { items: [invitation], nextCursor: null } }
          : response,
    });
    assert.equal((await runOwnerInvitation(delivery, services)).kind, "error");
  }
});
