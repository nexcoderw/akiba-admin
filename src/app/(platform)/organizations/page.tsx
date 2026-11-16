import { Suspense } from "react";
import {
  OrganizationListView,
  OrganizationLoading,
} from "@/components/organizations/organization-views";
import type { SearchParams } from "@/lib/organizations/contracts";

export default function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<OrganizationLoading />}>
      <OrganizationListView searchParams={searchParams} />
    </Suspense>
  );
}
