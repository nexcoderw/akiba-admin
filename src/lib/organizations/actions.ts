"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session.server";
import {
  backendCreateOrganizationRequest,
  backendUpdateOrganizationRequest,
  getAuthConfig,
} from "@/lib/auth/backend.server";
import { browserOriginAllowed, platformCookies } from "@/lib/auth/policy";
import {
  ORGANIZATIONS_CREATE,
  ORGANIZATIONS_UPDATE,
  parseOrganizationUpdateTarget,
  validateOrganizationName,
  normalizeOrganizationName,
  parseOrganization,
  validateOrganizationRegistration,
} from "@/lib/organizations/contracts";

export type OrganizationSaveResult =
  | { ok: true; organizationId: string }
  | {
      ok: false;
      kind:
        | "validation"
        | "unauthenticated"
        | "forbidden"
        | "conflict"
        | "uncertain"
        | "unavailable";
      message: string;
      fieldErrors?: { name?: string; slug?: string };
    };

const messages = {
  unauthenticated: "Your session has expired. Sign in again.",
  forbidden: "You don't have permission to save this organization.",
  conflict: "This subdomain is already in use. Choose another.",
  uncertain:
    "We couldn't confirm whether the organization was saved. Check the organization directory before trying again.",
  unavailable:
    "We couldn't save the organization right now. Please try again later.",
};

export async function saveOrganizationAction(
  formData: FormData,
  requestedTarget?: unknown,
): Promise<OrganizationSaveResult> {
  try {
    const target =
      requestedTarget === undefined
        ? undefined
        : parseOrganizationUpdateTarget(requestedTarget);
    if (target === null)
      return {
        ok: false,
        kind: "validation",
        message: "Refresh the directory and reopen the organization.",
      };
    const values: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (
        (key !== "name" && (target !== undefined || key !== "slug")) ||
        typeof value !== "string" ||
        Object.hasOwn(values, key)
      )
        return {
          ok: false,
          kind: "validation",
          message: "Review the highlighted fields.",
        };
      values[key] = value;
    }

    const name = values.name;
    const slug = values.slug;
    const fieldErrors = target
      ? validateOrganizationName(name)
      : validateOrganizationRegistration(name, slug);
    if (Object.keys(fieldErrors).length)
      return {
        ok: false,
        kind: "validation",
        message: "Review the highlighted fields.",
        fieldErrors,
      };
    if (typeof name !== "string" || (!target && typeof slug !== "string"))
      return {
        ok: false,
        kind: "validation",
        message: "Review the highlighted fields.",
      };

    const config = getAuthConfig();
    const requestHeaders = new Headers(await headers());
    if (!browserOriginAllowed(requestHeaders, config.adminOrigin, true))
      return {
        ok: false,
        kind: "forbidden",
        message: messages.forbidden,
      };

    const session = await getSession();
    if (session.kind === "unauthenticated")
      return {
        ok: false,
        kind: "unauthenticated",
        message: messages.unauthenticated,
      };
    if (session.kind !== "authenticated")
      return {
        ok: false,
        kind: "unavailable",
        message: messages.unavailable,
      };
    if (
      !session.session.permissions.includes(
        target ? ORGANIZATIONS_UPDATE : ORGANIZATIONS_CREATE,
      )
    )
      return {
        ok: false,
        kind: "forbidden",
        message: messages.forbidden,
      };

    const cookieStore = await cookies();
    const incoming = platformCookies(cookieStore.toString(), config.secure);
    if (!incoming.csrf)
      return {
        ok: false,
        kind: "forbidden",
        message: messages.forbidden,
      };

    const response = target
      ? await backendUpdateOrganizationRequest(
          cookieStore.toString(),
          target.id,
          { name: normalizeOrganizationName(name) },
          incoming.csrf,
          target.updatedAt,
        )
      : await backendCreateOrganizationRequest(
          cookieStore.toString(),
          { name: normalizeOrganizationName(name), slug },
          incoming.csrf,
        );

    if (response.status === 401)
      return {
        ok: false,
        kind: "unauthenticated",
        message: messages.unauthenticated,
      };
    if (response.status === 403)
      return { ok: false, kind: "forbidden", message: messages.forbidden };
    if (target && [404, 409, 412].includes(response.status))
      return {
        ok: false,
        kind: "conflict",
        message:
          "This organization changed or is no longer available for editing. Close this dialog, reset the directory, and reopen the record before saving.",
      };
    if (response.status === 409)
      return { ok: false, kind: "conflict", message: messages.conflict };
    if (
      response.status !== (target ? 200 : 201) ||
      response.cookies.length !== 0
    ) {
      return {
        ok: false,
        kind:
          response.status === 400 || response.status === 422
            ? "validation"
            : "uncertain",
        message:
          response.status === 400 || response.status === 422
            ? "Review the organization name and subdomain format."
            : messages.uncertain,
        ...(response.status === 400 || response.status === 422
          ? {
              fieldErrors: {
                name: "Check the organization name and field requirements.",
              },
            }
          : {}),
      };
    }

    const organization = parseOrganization(response.body);
    if (
      !organization ||
      (target
        ? organization.id !== target.id ||
          organization.name !== normalizeOrganizationName(name)
        : organization.status !== "PENDING")
    )
      return {
        ok: false,
        kind: "uncertain",
        message: messages.uncertain,
      };
    revalidatePath("/organizations");
    return { ok: true, organizationId: organization.id };
  } catch {
    return { ok: false, kind: "uncertain", message: messages.uncertain };
  }
}
