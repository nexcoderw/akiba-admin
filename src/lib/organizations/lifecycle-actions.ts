"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "../auth/session.server";
import {
  backendOrganizationRequest,
  backendSuspendOrganizationRequest,
  getAuthConfig,
} from "../auth/backend.server";
import { browserOriginAllowed, platformCookies } from "../auth/policy";
import { parseOrganizationUpdateTarget } from "./contracts";
import { suspendOrganization, type LifecycleResult } from "./lifecycle";

export async function suspendOrganizationAction(
  input: unknown,
): Promise<LifecycleResult> {
  try {
    const config = getAuthConfig();
    const cookie = (await cookies()).toString();
    const incoming = platformCookies(cookie, config.secure);
    const result = await suspendOrganization(input, {
      session: getSession,
      verifyRequest: async () =>
        Boolean(incoming.csrf) &&
        browserOriginAllowed(
          new Headers(await headers()),
          config.adminOrigin,
          true,
        ),
      read: async (id) => {
        const response = await backendOrganizationRequest(
          { kind: "detail", id },
          cookie,
        );
        return { ...response, cookieCount: response.cookies.length };
      },
      suspend: async (id, expected) => {
        if (!incoming.csrf) throw new Error("Missing request protection.");
        const response = await backendSuspendOrganizationRequest(
          cookie,
          id,
          expected,
          incoming.csrf,
        );
        return { ...response, cookieCount: response.cookies.length };
      },
    });
    const target = parseOrganizationUpdateTarget(input);
    if (target && result.kind !== "unauthenticated") {
      revalidatePath("/organizations");
      revalidatePath(`/organizations/${target.id}`);
    }
    return result;
  } catch {
    return {
      kind: "error",
      problem: {
        status: 503,
        code: "SERVICE_UNAVAILABLE",
        message:
          "We couldn't confirm the change. Refresh the organization to check its status before trying again.",
      },
      refreshRequired: true,
    };
  }
}
