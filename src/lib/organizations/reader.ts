import type { SafeProblem, SessionResult } from "../auth/contracts.ts";
import {
  ORGANIZATIONS_READ,
  organizationProblem,
  parseOrganization,
  parseOrganizationPage,
  type OrganizationQuery,
  type OrganizationTarget,
} from "./contracts.ts";

export type OrganizationRead<T> =
  | { kind: "success"; data: T }
  | { kind: "unauthenticated" }
  | { kind: "error"; problem: SafeProblem };

export interface OrganizationReaderServices {
  session: () => Promise<SessionResult>;
  request: (
    target: OrganizationTarget,
  ) => Promise<{ status: number; body: unknown }>;
}

async function read<T>(
  target: OrganizationTarget,
  parse: (body: unknown) => T | null,
  services: OrganizationReaderServices,
): Promise<OrganizationRead<T>> {
  try {
    const session = await services.session();
    if (session.kind === "unauthenticated") return { kind: "unauthenticated" };
    if (session.kind !== "authenticated")
      return {
        kind: "error",
        problem: organizationProblem(session.kind === "denied" ? 403 : 503),
      };
    if (!session.session.permissions.includes(ORGANIZATIONS_READ))
      return {
        kind: "error",
        problem: organizationProblem(403),
      };
    const response = await services.request(target);
    if (response.status === 401) return { kind: "unauthenticated" };
    if (response.status !== 200)
      return {
        kind: "error",
        problem: organizationProblem(response.status, response.body),
      };
    const data = parse(response.body);
    return data === null
      ? { kind: "error", problem: organizationProblem(502) }
      : { kind: "success", data };
  } catch {
    return { kind: "error", problem: organizationProblem(503) };
  }
}

export function readOrganizationList(
  query: OrganizationQuery,
  services: OrganizationReaderServices,
) {
  return read(
    { kind: "list", query },
    (body) => {
      const page = parseOrganizationPage(body, query.limit);
      if (
        !page ||
        page.nextCursor === query.cursor ||
        page.items.some(
          (item) =>
            item.id === query.cursor ||
            (query.status
              ? item.status !== query.status
              : item.status === "ARCHIVED"),
        )
      )
        return null;
      return page;
    },
    services,
  );
}

export function readOrganizationDetail(
  id: string,
  services: OrganizationReaderServices,
) {
  return read(
    { kind: "detail", id },
    (body) => {
      const organization = parseOrganization(body);
      return organization?.id.toLowerCase() === id.toLowerCase()
        ? organization
        : null;
    },
    services,
  );
}
