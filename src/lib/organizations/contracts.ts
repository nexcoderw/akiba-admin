import { isRecord, safeProblem, type SafeProblem } from "../auth/contracts.ts";

export const ORGANIZATIONS_READ = "platform.organizations.read";
export const ORGANIZATIONS_UPDATE = "platform.organizations.update";
export const ORGANIZATIONS_CREATE = "platform.organizations.create";
export const organizationStatuses = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
] as const;
export type OrganizationStatus = (typeof organizationStatuses)[number];
export const statusLabels: Record<OrganizationStatus, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
};
export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
  suspendedAt: string | null;
  archivedAt: string | null;
}
export interface OrganizationPage {
  items: Organization[];
  nextCursor: string | null;
}
export interface OrganizationQuery {
  limit: number;
  status?: OrganizationStatus;
  cursor?: string;
  previous: string[];
}

export interface OrganizationRegistrationErrors {
  name?: string;
  slug?: string;
}

export function normalizeOrganizationName(value: string): string {
  return value.replace(/^[\s\u0085]+|[\s\u0085]+$/gu, "");
}

export function validateOrganizationName(
  name: unknown,
): OrganizationRegistrationErrors {
  const errors: OrganizationRegistrationErrors = {};
  const normalizedName =
    typeof name === "string" ? normalizeOrganizationName(name) : "";
  if (
    typeof name !== "string" ||
    !/[^\s\u0085]/u.test(normalizedName) ||
    normalizedName.length > 160 ||
    normalizedName.includes("\u0000")
  ) {
    errors.name = "Enter a valid organization name (up to 160 characters).";
  }
  return errors;
}

export function parseOrganizationUpdateTarget(
  value: unknown,
): { id: string; updatedAt: string } | null {
  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => key !== "id" && key !== "updatedAt") ||
    !validOrganizationId(value.id) ||
    typeof value.updatedAt !== "string"
  )
    return null;
  const timestamp = value.updatedAt;
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp) ||
    !Number.isFinite(Date.parse(timestamp)) ||
    new Date(timestamp).toISOString() !== timestamp
  )
    return null;
  return { id: value.id, updatedAt: timestamp };
}

/** Matches the verified CreateOrganizationDto without taking authority from the browser. */
export function validateOrganizationRegistration(
  name: unknown,
  slug: unknown,
): OrganizationRegistrationErrors {
  const errors = validateOrganizationName(name);
  if (
    typeof slug !== "string" ||
    slug.length < 3 ||
    slug.length > 63 ||
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?![\s\S])/u.test(slug)
  ) {
    errors.slug =
      "Use 3–63 lowercase letters or numbers, separated by single hyphens.";
  }
  return errors;
}

export function suggestOrganizationSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .replace(/-+/gu, "-")
    .slice(0, 63)
    .replace(/-+$/u, "");
  return /^[a-z]/u.test(slug) ? slug : slug ? `org-${slug}`.slice(0, 63) : "";
}
export type SearchParams = Record<string, string | string[] | undefined>;

export function validOrganizationId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      value,
    )
  );
}
function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 40 &&
    /^\d{4}-\d{2}-\d{2}T/u.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}
function isStatus(value: unknown): value is OrganizationStatus {
  return organizationStatuses.some((status) => status === value);
}
export function parseOrganization(value: unknown): Organization | null {
  if (
    !isRecord(value) ||
    !validOrganizationId(value.id) ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 160 ||
    typeof value.slug !== "string" ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/u.test(value.slug) ||
    !isStatus(value.status) ||
    !validDate(value.createdAt) ||
    !validDate(value.updatedAt) ||
    ![value.activatedAt, value.suspendedAt, value.archivedAt].every(
      (date) => date === null || validDate(date),
    )
  )
    return null;
  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    activatedAt: value.activatedAt as string | null,
    suspendedAt: value.suspendedAt as string | null,
    archivedAt: value.archivedAt as string | null,
  };
}
export function parseOrganizationPage(
  value: unknown,
  limit: number,
): OrganizationPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    value.items.length > limit ||
    (value.nextCursor !== null && !validOrganizationId(value.nextCursor))
  )
    return null;
  const items = value.items.map(parseOrganization);
  if (items.some((item) => item === null)) return null;
  const valid = items as Organization[];
  if (
    new Set(valid.map((item) => item.id)).size !== valid.length ||
    (value.nextCursor !== null &&
      (valid.length !== limit || value.nextCursor !== valid.at(-1)?.id))
  )
    return null;
  return { items: valid, nextCursor: value.nextCursor };
}
/** Only these query fields reach the API. History is a bounded UI breadcrumb of cursors. */
export function parseOrganizationQuery(
  params: SearchParams,
): OrganizationQuery | null {
  if (
    Object.keys(params).some(
      (key) => !["limit", "status", "cursor", "previous"].includes(key),
    ) ||
    Object.values(params).some((value) => Array.isArray(value))
  )
    return null;
  if (
    params.limit !== undefined &&
    (typeof params.limit !== "string" || !/^[1-9][0-9]?$/u.test(params.limit))
  )
    return null;
  if (typeof params.previous === "string" && params.previous.length > 800)
    return null;
  const limit = params.limit === undefined ? 20 : Number(params.limit);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50 ||
    (params.status && !isStatus(params.status)) ||
    (params.cursor && !validOrganizationId(params.cursor))
  )
    return null;
  const history =
    typeof params.previous === "string" ? params.previous.split(",") : [];
  if (
    history.length > 20 ||
    history.some((id) => id !== "first" && !validOrganizationId(id)) ||
    (history.length > 0 && !params.cursor)
  )
    return null;
  return {
    limit,
    status: params.status ? (params.status as OrganizationStatus) : undefined,
    cursor: params.cursor ? (params.cursor as string) : undefined,
    previous: history,
  };
}
export function organizationListHref(query: OrganizationQuery): string {
  const params = new URLSearchParams({ limit: String(query.limit) });
  if (query.status) params.set("status", query.status);
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.previous.length) params.set("previous", query.previous.join(","));
  return `/organizations?${params}`;
}
export function pageLinks(query: OrganizationQuery, nextCursor: string | null) {
  const previous = query.previous.at(-1);
  return {
    first: organizationListHref({ ...query, cursor: undefined, previous: [] }),
    previous: previous
      ? organizationListHref({
          ...query,
          cursor: previous === "first" ? undefined : previous,
          previous: query.previous.slice(0, -1),
        })
      : null,
    next: nextCursor
      ? organizationListHref({
          ...query,
          cursor: nextCursor,
          previous: [...query.previous, query.cursor ?? "first"].slice(-20),
        })
      : null,
  };
}
export type OrganizationTarget =
  { kind: "list"; query: OrganizationQuery } | { kind: "detail"; id: string };
export function organizationApiPath(target: OrganizationTarget): string {
  const base = "/api/v1/platform/organizations";
  if (target.kind === "detail") {
    if (!validOrganizationId(target.id))
      throw new Error("Invalid organization identifier.");
    return `${base}/${target.id}`;
  }
  const { query } = target;
  const checked = parseOrganizationQuery({
    limit: String(query.limit),
    status: query.status,
    cursor: query.cursor,
  });
  if (!checked) throw new Error("Invalid organization query.");
  const params = new URLSearchParams({ limit: String(checked.limit) });
  if (checked.status) params.set("status", checked.status);
  if (checked.cursor) params.set("cursor", checked.cursor);
  return `${base}?${params}`;
}
export function organizationProblem(
  status: number,
  body?: unknown,
): SafeProblem {
  const safe = safeProblem(status, body, "session");
  const messages: Record<number, string> = {
    0: "Unable to connect. Please check your connection and try again.",
    400: "This page or filter is no longer valid. Return to the first page and try again.",
    401: "Your session has expired. Sign in again.",
    403: "You don't have permission to view this information.",
    404: "This organization could not be found.",
    429: "Too many requests. Please wait before trying again.",
  };
  return {
    ...safe,
    code: status === 404 ? "ORGANIZATION_NOT_FOUND" : safe.code,
    message:
      messages[status] ??
      "We couldn't load organizations right now. Please try again.",
  };
}

/** Return links may select only the organization list and validated list parameters. */
export function organizationReturnHref(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    !value.startsWith("/organizations?")
  )
    return "/organizations";
  const url = new URL(value, "https://internal.invalid");
  if (url.pathname !== "/organizations" || url.hash) return "/organizations";
  const entries: [string, string][] = [];
  for (const key of url.searchParams.keys()) {
    if (url.searchParams.getAll(key).length !== 1) return "/organizations";
    entries.push([key, url.searchParams.get(key) ?? ""]);
  }
  const query = parseOrganizationQuery(Object.fromEntries(entries));
  return query ? organizationListHref(query) : "/organizations";
}
