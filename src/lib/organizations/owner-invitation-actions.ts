"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "../auth/session.server";
import {
  backendOrganizationRequest,
  backendOwnerInvitationRequest,
  getAuthConfig,
} from "../auth/backend.server";
import { browserOriginAllowed, platformCookies } from "../auth/policy";
import {
  parseInvitationCommand,
  ownerInvitationProblem,
} from "./owner-invitations";
import {
  runOwnerInvitation,
  type OwnerInvitationResult,
} from "./owner-invitation-service";

/** Reads also arrive via a POST server action and require the same browser request protections. */
export async function ownerInvitationAction(
  input: unknown,
): Promise<OwnerInvitationResult> {
  const command = parseInvitationCommand(input);
  try {
    const config = getAuthConfig();
    const cookie = (await cookies()).toString();
    const incoming = platformCookies(cookie, config.secure);
    const result = await runOwnerInvitation(input, {
      session: getSession,
      verifyRequest: async () =>
        Boolean(incoming.csrf) &&
        browserOriginAllowed(
          new Headers(await headers()),
          config.adminOrigin,
          true,
        ),
      organization: async (id) => {
        const response = await backendOrganizationRequest(
          { kind: "detail", id },
          cookie,
        );
        return { ...response, cookieCount: response.cookies.length };
      },
      request: async (operation) => {
        if (!incoming.csrf) throw new Error("Missing request protection.");
        const response = await backendOwnerInvitationRequest(
          cookie,
          operation,
          incoming.csrf,
        );
        return { ...response, cookieCount: response.cookies.length };
      },
    });
    if (
      command &&
      command.operation !== "list" &&
      result.kind !== "unauthenticated"
    ) {
      revalidatePath("/organizations");
      revalidatePath(`/organizations/${command.organizationId}`);
    }
    return result;
  } catch {
    return {
      kind: "error",
      problem: ownerInvitationProblem(503),
      refreshRequired: command?.operation !== "list",
    };
  }
}
