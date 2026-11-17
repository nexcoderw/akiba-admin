import {
  isRecord,
  safeProblem,
  type SafeProblem,
  type SessionResult,
} from "../auth/contracts.ts";
import {
  ORGANIZATIONS_READ,
  organizationApiPath,
  parseOrganization,
  parseOrganizationUpdateTarget,
  type Organization,
  type OrganizationStatus,
} from "./contracts.ts";

export const ORGANIZATIONS_SUSPEND = "platform.organizations.suspend";
export const ORGANIZATIONS_ACTIVATE = "platform.organizations.activate";

/** Activation is explicitly blocked by the current API readiness gate. */
export function lifecycleAvailability(
  status: OrganizationStatus,
  permissions: readonly string[],
) {
  return {
    canSuspend:
      status === "ACTIVE" && permissions.includes(ORGANIZATIONS_SUSPEND),
    unavailable: permissions.includes(ORGANIZATIONS_ACTIVATE)
      ? status === "PENDING"
        ? "Approval is unavailable until the required onboarding and owner verification checks are supported."
        : status === "SUSPENDED"
          ? "Reactivation is unavailable until the required onboarding and owner verification checks are supported."
          : null
      : null,
  };
}

export function suspensionRequest(input: unknown) {
  const target = parseOrganizationUpdateTarget(input);
  if (!target) throw new Error("Invalid organization precondition.");
  return {
    path: `${organizationApiPath({ kind: "detail", id: target.id })}/suspension`,
    method: "POST" as const,
    body: { expectedUpdatedAt: target.updatedAt },
  };
}

export type LifecycleResult =
  | { kind: "success"; organization: Organization }
  | { kind: "unauthenticated" }
  | { kind: "error"; problem: SafeProblem; refreshRequired: boolean };

type Response = { status: number; body: unknown; cookieCount?: number };
export interface LifecycleServices {
  session: () => Promise<SessionResult>;
  verifyRequest: () => Promise<boolean>;
  read: (id: string) => Promise<Response>;
  suspend: (id: string, expectedUpdatedAt: string) => Promise<Response>;
}

function failure(status: number, body?: unknown): LifecycleResult {
  const messages: Record<number, string> = {
    400: "Refresh the organization and review the request before continuing.",
    403: "You don't have permission to perform this action.",
    404: "This organization is no longer available. Refresh to continue.",
    409: "This organization is no longer eligible for suspension. Refresh to continue.",
    412: "Someone else updated this organization. Refresh before continuing.",
    429: "Too many requests. Wait before refreshing and trying again.",
  };
  const safe = safeProblem(status, body, "session");
  const knownCodes = new Set([
    "ORGANIZATION_NOT_FOUND",
    "ORGANIZATION_STALE",
    "ORGANIZATION_TRANSITION_CONFLICT",
    "ORGANIZATION_PRECONDITION_REQUIRED",
    "ORGANIZATION_INTEGRITY_REJECTED",
    "ORGANIZATION_PERSISTENCE_UNAVAILABLE",
  ]);
  const code =
    isRecord(body) && typeof body.code === "string" && knownCodes.has(body.code)
      ? body.code
      : status === 404
        ? "ORGANIZATION_NOT_FOUND"
        : status === 412
          ? "ORGANIZATION_STALE"
          : status === 409
            ? "ORGANIZATION_TRANSITION_CONFLICT"
            : safe.code;
  return {
    kind: "error",
    problem: {
      ...safe,
      code,
      message:
        messages[status] ??
        "We couldn't confirm the change. Refresh the organization to check its current status before trying again.",
    },
    refreshRequired: true,
  };
}

/** Checks live state before the write; the API timestamp precondition closes the remaining race. */
export async function suspendOrganization(
  input: unknown,
  services: LifecycleServices,
): Promise<LifecycleResult> {
  try {
    const target = parseOrganizationUpdateTarget(input);
    if (!target) return failure(400);
    if (!(await services.verifyRequest())) return failure(403);
    const session = await services.session();
    if (session.kind === "unauthenticated") return { kind: "unauthenticated" };
    if (session.kind !== "authenticated")
      return failure(session.kind === "denied" ? 403 : 503);
    if (
      ![ORGANIZATIONS_READ, ORGANIZATIONS_SUSPEND].every((permission) =>
        session.session.permissions.includes(permission),
      )
    )
      return failure(403);

    const before = await services.read(target.id);
    if (before.status === 401) return { kind: "unauthenticated" };
    if (before.status !== 200) return failure(before.status, before.body);
    const current = parseOrganization(before.body);
    if (!current || current.id !== target.id || before.cookieCount)
      return failure(502);
    if (current.updatedAt !== target.updatedAt) return failure(412);
    if (current.status !== "ACTIVE") return failure(409);

    const response = await services.suspend(target.id, target.updatedAt);
    if (response.status === 401) return { kind: "unauthenticated" };
    if (response.status !== 200) return failure(response.status, response.body);
    const organization = parseOrganization(response.body);
    if (
      !organization ||
      response.cookieCount ||
      organization.id !== target.id ||
      organization.slug !== current.slug ||
      organization.name !== current.name ||
      organization.status !== "SUSPENDED" ||
      organization.createdAt !== current.createdAt ||
      organization.activatedAt !== current.activatedAt ||
      organization.archivedAt !== current.archivedAt ||
      organization.suspendedAt === null ||
      Date.parse(organization.suspendedAt) >
        Date.parse(organization.updatedAt) ||
      Date.parse(organization.updatedAt) <= Date.parse(target.updatedAt)
    )
      return failure(502);
    return { kind: "success", organization };
  } catch {
    return failure(503);
  }
}
