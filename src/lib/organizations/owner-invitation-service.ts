import type { SafeProblem, SessionResult } from "../auth/contracts.ts";
import { ORGANIZATIONS_READ, parseOrganization } from "./contracts.ts";
import {
  OWNER_PERMISSIONS,
  deliveryStatuses,
  invitationRequest,
  ownerInvitationProblem,
  parseInvitationCommand,
  parseInvitationPage,
  parseOwnerInvitation,
  type DeliveryStatus,
  type InvitationPage,
  type OwnerInvitation,
} from "./owner-invitations.ts";
import { isRecord } from "../auth/contracts.ts";

export type OwnerInvitationResult =
  | { kind: "page"; page: InvitationPage }
  | { kind: "invitation"; invitation: OwnerInvitation }
  | { kind: "delivery"; status: DeliveryStatus }
  | { kind: "unauthenticated" }
  | { kind: "error"; problem: SafeProblem; refreshRequired: boolean };
type Response = { status: number; body: unknown; cookieCount?: number };
export interface OwnerInvitationServices {
  verifyRequest: () => Promise<boolean>;
  session: () => Promise<SessionResult>;
  organization: (id: string) => Promise<Response>;
  request: (
    command: Parameters<typeof invitationRequest>[0],
  ) => Promise<Response>;
}

export async function runOwnerInvitation(
  input: unknown,
  services: OwnerInvitationServices,
): Promise<OwnerInvitationResult> {
  const command = parseInvitationCommand(input);
  const fail = (status: number, body?: unknown): OwnerInvitationResult => ({
    kind: "error",
    problem: ownerInvitationProblem(status, body),
    refreshRequired: command?.operation !== "list",
  });
  if (!command) return fail(400);
  try {
    if (!(await services.verifyRequest())) return fail(403);
    const session = await services.session();
    if (session.kind === "unauthenticated") return { kind: "unauthenticated" };
    if (session.kind !== "authenticated")
      return fail(session.kind === "denied" ? 403 : 503);
    const permissions = session.session.permissions;
    if (
      ![ORGANIZATIONS_READ, OWNER_PERMISSIONS.read].every((permission) =>
        permissions.includes(permission),
      ) ||
      (command.operation !== "list" &&
        !permissions.includes(OWNER_PERMISSIONS[command.operation]))
    )
      return fail(403);

    const scope = await services.organization(command.organizationId);
    if (scope.status === 401) return { kind: "unauthenticated" };
    if (scope.status !== 200) return fail(scope.status, scope.body);
    const organization = parseOrganization(scope.body);
    if (
      !organization ||
      organization.id !== command.organizationId ||
      scope.cookieCount
    )
      return fail(502);
    if (
      (command.operation === "create" || command.operation === "delivery") &&
      !["PENDING", "ACTIVE"].includes(organization.status)
    )
      return fail(409);

    let previous: OwnerInvitation | undefined;
    if (command.operation === "revoke" || command.operation === "delivery") {
      const response = await services.request({
        operation: "list",
        organizationId: command.organizationId,
        cursor: command.cursor,
      });
      if (response.status === 401) return { kind: "unauthenticated" };
      if (response.status !== 200) return fail(response.status, response.body);
      const page = parseInvitationPage(
        response.body,
        command.organizationId,
        command.cursor,
      );
      if (!page || response.cookieCount) return fail(502);
      previous = page.items.find((item) => item.id === command.invitationId);
      if (!previous) return fail(409);
      if (
        command.operation === "revoke" &&
        !["PENDING_DELIVERY", "SENT"].includes(previous.status)
      )
        return fail(409);
      if (
        command.operation === "delivery" &&
        (previous.status !== "PENDING_DELIVERY" ||
          previous.deliveryStatus !== null)
      )
        return fail(409);
    }

    const response = await services.request(command);
    if (response.status === 401) return { kind: "unauthenticated" };
    const expectedStatus =
      command.operation === "create"
        ? 201
        : command.operation === "delivery"
          ? 202
          : 200;
    if (response.status !== expectedStatus)
      return fail(
        response.status >= 200 && response.status < 300 ? 502 : response.status,
        response.body,
      );
    if (response.cookieCount) return fail(502);
    if (command.operation === "list") {
      const page = parseInvitationPage(
        response.body,
        command.organizationId,
        command.cursor,
      );
      return page ? { kind: "page", page } : fail(502);
    }
    if (command.operation === "delivery") {
      const status = isRecord(response.body) ? response.body.status : undefined;
      return deliveryStatuses.some((value) => value === status)
        ? { kind: "delivery", status: status as DeliveryStatus }
        : fail(502);
    }
    const invitation = parseOwnerInvitation(
      response.body,
      command.organizationId,
    );
    if (!invitation) return fail(502);
    if (command.operation === "create") {
      if (
        invitation.status !== "PENDING_DELIVERY" ||
        invitation.email !== command.email ||
        invitation.displayName !== command.displayName ||
        invitation.deliveryStatus !== null
      )
        return fail(502);
    } else if (
      !previous ||
      invitation.id !== command.invitationId ||
      invitation.status !== "REVOKED" ||
      invitation.email !== previous.email ||
      invitation.displayName !== previous.displayName ||
      Date.parse(invitation.updatedAt) <= Date.parse(previous.updatedAt)
    )
      return fail(502);
    return { kind: "invitation", invitation };
  } catch {
    return fail(503);
  }
}
