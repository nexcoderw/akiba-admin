import { isRecord, safeProblem, type SafeProblem } from "../auth/contracts.ts";
import { normalizeOrganizationName, validOrganizationId } from "./contracts.ts";

export const OWNER_PERMISSIONS = {
  read: "platform.organizations.owners.read",
  create: "platform.organizations.owners.invite",
  revoke: "platform.organizations.owners.revoke-invitation",
  delivery: "platform.organizations.owners.send-invitation",
} as const;
export const invitationStatuses = [
  "PENDING_DELIVERY",
  "SENT",
  "ACCEPTED",
  "REVOKED",
] as const;
export const deliveryStatuses = [
  "QUEUED",
  "PROCESSING",
  "CONFIRMED",
  "FAILED",
  "UNCERTAIN",
] as const;
export type InvitationStatus = (typeof invitationStatuses)[number];
export type DeliveryStatus = (typeof deliveryStatuses)[number];
export interface OwnerInvitation {
  id: string;
  organizationId: string;
  displayName: string;
  email: string;
  status: InvitationStatus;
  deliveryStatus: DeliveryStatus | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
}
export interface InvitationPage {
  items: OwnerInvitation[];
  nextCursor: string | null;
}
export type InvitationCommand =
  | { operation: "list"; organizationId: string; cursor?: string }
  | {
      operation: "create";
      organizationId: string;
      displayName: string;
      email: string;
    }
  | {
      operation: "revoke" | "delivery";
      organizationId: string;
      invitationId: string;
      cursor?: string;
    };

/** Mirrors the API's ASCII local-part and NFC/IDNA domain policy without network access. */
export function normalizeInvitationEmail(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 512) return null;
  const parts = value.replace(/^[\s\u0085]+|[\s\u0085]+$/gu, "").split("@");
  const [local, domain] = parts;
  if (
    parts.length !== 2 ||
    !local ||
    !domain ||
    local.length > 64 ||
    !/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/u.test(
      local,
    ) ||
    !/^[\p{L}\p{M}\p{N}.-]+$/u.test(domain)
  )
    return null;
  try {
    const ascii = new URL(
      `https://${domain.normalize("NFC")}`,
    ).hostname.toLowerCase();
    const labels = ascii.split(".");
    if (
      labels.length < 2 ||
      !/[a-z]/u.test(labels.at(-1) ?? "") ||
      labels.some(
        (label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(label),
      )
    )
      return null;
    const email = `${local.toLowerCase()}@${ascii}`;
    return email.length <= 254 ? email : null;
  } catch {
    return null;
  }
}

export function validateOwnerInvite(displayName: unknown, email: unknown) {
  const errors: { displayName?: string; email?: string } = {};
  if (
    typeof displayName !== "string" ||
    !/[^\s\u0085]/u.test(displayName) ||
    normalizeOrganizationName(displayName).length > 160 ||
    displayName.includes("\u0000")
  )
    errors.displayName = "Enter the owner's name (up to 160 characters).";
  if (!normalizeInvitationEmail(email))
    errors.email = "Enter a valid email address.";
  return errors;
}

function date(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

export function parseOwnerInvitation(
  value: unknown,
  organizationId: string,
): OwnerInvitation | null {
  if (
    !isRecord(value) ||
    !validOrganizationId(value.id) ||
    value.organizationId !== organizationId ||
    typeof value.displayName !== "string" ||
    Object.keys(validateOwnerInvite(value.displayName, value.email)).length ||
    typeof value.email !== "string" ||
    !invitationStatuses.some((status) => status === value.status) ||
    (value.deliveryStatus !== null &&
      !deliveryStatuses.some((status) => status === value.deliveryStatus)) ||
    !date(value.createdAt) ||
    !date(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt) ||
    ![value.sentAt, value.expiresAt, value.acceptedAt, value.revokedAt].every(
      (item) => item === null || date(item),
    )
  )
    return null;
  if (
    value.status === "PENDING_DELIVERY" &&
    (value.sentAt !== null ||
      value.expiresAt !== null ||
      value.acceptedAt !== null ||
      value.revokedAt !== null)
  )
    return null;
  if (
    value.status === "SENT" &&
    (value.sentAt === null ||
      value.expiresAt === null ||
      value.acceptedAt !== null ||
      value.revokedAt !== null)
  )
    return null;
  if (
    value.status === "ACCEPTED" &&
    (value.acceptedAt === null || value.revokedAt !== null)
  )
    return null;
  if (
    value.status === "REVOKED" &&
    (value.revokedAt === null || value.acceptedAt !== null)
  )
    return null;
  // Explicit projection keeps tokens, digests and future upstream fields off the client boundary.
  return {
    id: value.id,
    organizationId,
    displayName: value.displayName,
    email: value.email,
    status: value.status as InvitationStatus,
    deliveryStatus: value.deliveryStatus as DeliveryStatus | null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    sentAt: value.sentAt as string | null,
    expiresAt: value.expiresAt as string | null,
    acceptedAt: value.acceptedAt as string | null,
    revokedAt: value.revokedAt as string | null,
  };
}

export function parseInvitationPage(
  value: unknown,
  organizationId: string,
  cursor?: string,
): InvitationPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    value.items.length > 20 ||
    (value.nextCursor !== null && !validOrganizationId(value.nextCursor))
  )
    return null;
  const items: OwnerInvitation[] = [];
  for (const raw of value.items) {
    const item = parseOwnerInvitation(raw, organizationId);
    if (
      !item ||
      item.id === cursor ||
      items.some((previous) => previous.id === item.id)
    )
      return null;
    items.push(item);
  }
  if (
    value.nextCursor !== null &&
    (items.length !== 20 ||
      value.nextCursor !== items.at(-1)?.id ||
      value.nextCursor === cursor)
  )
    return null;
  return { items, nextCursor: value.nextCursor as string | null };
}

export function parseInvitationCommand(
  value: unknown,
): InvitationCommand | null {
  if (!isRecord(value) || !validOrganizationId(value.organizationId))
    return null;
  const { operation, organizationId } = value;
  const allowed =
    operation === "create"
      ? ["operation", "organizationId", "displayName", "email"]
      : operation === "list"
        ? ["operation", "organizationId", "cursor"]
        : operation === "revoke" || operation === "delivery"
          ? ["operation", "organizationId", "invitationId", "cursor"]
          : [];
  if (
    !allowed.length ||
    Object.keys(value).some((key) => !allowed.includes(key))
  )
    return null;
  if (operation === "create") {
    if (
      typeof value.displayName !== "string" ||
      Object.keys(validateOwnerInvite(value.displayName, value.email)).length
    )
      return null;
    const email = normalizeInvitationEmail(value.email);
    return email
      ? {
          operation,
          organizationId,
          displayName: normalizeOrganizationName(value.displayName),
          email,
        }
      : null;
  }
  if (value.cursor !== undefined && !validOrganizationId(value.cursor))
    return null;
  const cursor = typeof value.cursor === "string" ? value.cursor : undefined;
  if (operation === "list") return { operation, organizationId, cursor };
  return (operation === "revoke" || operation === "delivery") &&
    validOrganizationId(value.invitationId)
    ? { operation, organizationId, invitationId: value.invitationId, cursor }
    : null;
}

export function invitationRequest(command: InvitationCommand) {
  const checked = parseInvitationCommand(command);
  if (!checked) throw new Error("Invalid invitation request.");
  const base = `/api/v1/platform/organizations/${checked.organizationId}/owner-invitations`;
  if (checked.operation === "list") {
    const query = new URLSearchParams({ limit: "20" });
    if (checked.cursor) query.set("cursor", checked.cursor);
    return {
      path: `${base}?${query}`,
      method: "GET" as const,
      body: undefined,
    };
  }
  if (checked.operation === "create")
    return {
      path: base,
      method: "POST" as const,
      body: { displayName: checked.displayName, email: checked.email },
    };
  return {
    path: `${base}/${checked.invitationId}/${checked.operation === "revoke" ? "revocation" : "delivery"}`,
    method: "POST" as const,
    body: {},
  };
}

export function ownerInvitationProblem(
  status: number,
  body?: unknown,
): SafeProblem {
  const safe = safeProblem(status, body, "session");
  const messages: Record<number, string> = {
    400: "Review the invitation details, or refresh to restart the list.",
    401: "Your session has expired. Sign in again.",
    403: "You don't have permission to manage owner invitations.",
    404: "This organization or invitation is no longer available.",
    409: "The invitation state has changed or an outstanding invitation conflicts with this request. Refresh before continuing.",
    410: "This invitation is no longer available. Refresh to check its status.",
    429: "Too many requests. Wait before refreshing and trying again.",
  };
  const known = [
    "OWNER_INVITATION_NOT_FOUND",
    "OWNER_INVITATION_TRANSITION_CONFLICT",
    "OWNER_INVITATION_ORGANIZATION_UNAVAILABLE",
    "OWNER_INVITATION_CONCURRENT_CHANGE",
    "OWNER_INVITATION_OUTSTANDING_CONFLICT",
    "OWNER_INVITATION_DELIVERY_CONFLICT",
    "OWNER_INVITATION_DELIVERY_UNAVAILABLE",
    "OWNER_INVITATION_PAGE_INVALID",
    "OWNER_INVITATION_CURSOR_INVALID",
    "OWNER_INVITATION_PERSISTENCE_UNAVAILABLE",
    "OWNER_INVITATION_INTEGRITY_REJECTED",
    "ORGANIZATION_NOT_FOUND",
  ];
  return {
    ...safe,
    code:
      isRecord(body) &&
      typeof body.code === "string" &&
      known.includes(body.code)
        ? body.code
        : safe.code,
    message:
      isRecord(body) && body.code === "OWNER_INVITATION_DELIVERY_UNAVAILABLE"
        ? "Invitation delivery is unavailable. No delivery success was confirmed. Refresh status before trying again."
        : (messages[status] ??
          "We couldn't confirm this request. Refresh invitation status before trying again."),
  };
}

export function ownerInvitationAvailability(
  organizationStatus: string,
  permissions: readonly string[],
  invitation?: OwnerInvitation,
) {
  const read = permissions.includes(OWNER_PERMISSIONS.read);
  const eligible =
    organizationStatus === "PENDING" || organizationStatus === "ACTIVE";
  return {
    read,
    create: read && eligible && permissions.includes(OWNER_PERMISSIONS.create),
    delivery:
      read &&
      eligible &&
      permissions.includes(OWNER_PERMISSIONS.delivery) &&
      invitation?.status === "PENDING_DELIVERY" &&
      invitation.deliveryStatus === null,
    revoke:
      read &&
      permissions.includes(OWNER_PERMISSIONS.revoke) &&
      invitation !== undefined &&
      ["PENDING_DELIVERY", "SENT"].includes(invitation.status),
  };
}

export const deliveryLabels: Record<DeliveryStatus, string> = {
  QUEUED: "Queued",
  PROCESSING: "Processing",
  CONFIRMED: "Provider accepted — inbox receipt unconfirmed",
  FAILED: "Delivery failed — operator review required",
  UNCERTAIN: "Delivery uncertain — do not resend",
};
