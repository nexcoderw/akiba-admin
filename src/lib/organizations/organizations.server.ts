import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "../auth/session.server";
import { backendOrganizationRequest } from "../auth/backend.server";
import type { OrganizationQuery, OrganizationTarget } from "./contracts";
import {
  readOrganizationDetail,
  readOrganizationList,
  type OrganizationRead,
} from "./reader";

const services = {
  session: getSession,
  request: async (target: OrganizationTarget) =>
    backendOrganizationRequest(target, (await cookies()).toString()),
};

function finish<T>(result: OrganizationRead<T>) {
  if (result.kind === "unauthenticated") redirect("/login?expired=1&next=%2F");
  return result;
}

export async function listOrganizations(query: OrganizationQuery) {
  return finish(await readOrganizationList(query, services));
}

export async function getOrganization(id: string) {
  return finish(await readOrganizationDetail(id, services));
}
