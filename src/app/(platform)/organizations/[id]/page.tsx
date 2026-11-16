import { Suspense } from "react";
import {
  OrganizationDetailView,
  OrganizationLoading,
} from "@/components/organizations/organization-views";
import type { SearchParams } from "@/lib/organizations/contracts";

export default function OrganizationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<OrganizationLoading />}>
      <OrganizationDetailView params={params} searchParams={searchParams} />
    </Suspense>
  );
}
