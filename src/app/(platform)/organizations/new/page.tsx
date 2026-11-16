import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrganizationProblem } from "@/components/organizations/organization-problem";
import { OrganizationRegistrationForm } from "@/components/organizations/organization-registration-form";
import { PageHeader } from "@/components/shared/page-header";
import { getSession } from "@/lib/auth/session.server";
import { ORGANIZATIONS_CREATE } from "@/lib/organizations/contracts";
import styles from "./organization-registration-page.module.css";

export const metadata: Metadata = { title: "Register organization · Akiba" };

export default async function NewOrganizationPage() {
  const result = await getSession();
  if (result.kind === "unauthenticated")
    redirect("/login?expired=1&next=%2Forganizations%2Fnew");
  if (result.kind !== "authenticated")
    return (
      <OrganizationProblem
        problem={{
          status: result.kind === "denied" ? 403 : 503,
          code:
            result.kind === "denied" ? "ACCESS_DENIED" : "SERVICE_UNAVAILABLE",
          message:
            result.kind === "denied"
              ? "You don't have permission to register organizations."
              : "We couldn't verify your access. Please try again later.",
        }}
      />
    );
  if (!result.session.permissions.includes(ORGANIZATIONS_CREATE))
    return (
      <OrganizationProblem
        problem={{
          status: 403,
          code: "ACCESS_DENIED",
          message: "You don't have permission to register organizations.",
        }}
      />
    );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Register organization"
        description="Add an organization to the platform. Registration creates a pending record for review."
      />
      <OrganizationRegistrationForm />
    </div>
  );
}
