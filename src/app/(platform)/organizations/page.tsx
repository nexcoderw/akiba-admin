import { OWNER_PERMISSIONS } from "@/lib/organizations/owner-invitations";
import { Suspense } from "react";
import { OrganizationLoading } from "@/components/organizations/organization-views";
import { OrganizationList } from "@/components/organizations/organization-list";
import { OrganizationProblem } from "@/components/organizations/organization-problem";
import {
  ORGANIZATIONS_CREATE,
  ORGANIZATIONS_UPDATE,
  organizationProblem,
  parseOrganizationQuery,
  type SearchParams,
} from "@/lib/organizations/contracts";
import { listOrganizations } from "@/lib/organizations/organizations.server";
import {
  ORGANIZATIONS_ACTIVATE,
  ORGANIZATIONS_SUSPEND,
} from "@/lib/organizations/lifecycle";
import { getSession } from "@/lib/auth/session.server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Organizations · Akiba" };

async function OrganizationRegistry({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = parseOrganizationQuery(await searchParams);
  if (!query) return <OrganizationProblem problem={organizationProblem(400)} />;
  const [result, session] = await Promise.all([
    listOrganizations(query),
    getSession(),
  ]);
  if (result.kind === "error")
    return <OrganizationProblem problem={result.problem} />;
  return (
    <OrganizationList
      data={result.data}
      query={query}
      lifecyclePermissions={
        session.kind === "authenticated"
          ? session.session.permissions.filter((permission) =>
              [
                ORGANIZATIONS_ACTIVATE,
                ORGANIZATIONS_SUSPEND,
                ...Object.values(OWNER_PERMISSIONS),
              ].includes(permission),
            )
          : []
      }
      canEdit={
        session.kind === "authenticated" &&
        session.session.permissions.includes(ORGANIZATIONS_UPDATE)
      }
      canCreate={
        session.kind === "authenticated" &&
        session.session.permissions.includes(ORGANIZATIONS_CREATE)
      }
    />
  );
}

export default function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<OrganizationLoading />}>
      <OrganizationRegistry searchParams={searchParams} />
    </Suspense>
  );
}
