import { OrganizationLifecycle } from "./organization-lifecycle";
import { OrganizationStatusBadge } from "./organization-status-badge";
import { formatOrganizationDateTime } from "./organization-dates";
import type { Organization } from "@/lib/organizations/contracts";
import styles from "./organization-overview.module.css";

export function OrganizationOverview({
  organization,
  permissions,
  onRefresh,
  onInteractionChange,
}: {
  organization: Organization;
  permissions: string[];
  onRefresh: () => void;
  onInteractionChange: (busy: boolean) => void;
}) {
  const timeline = [
    ["Registered", organization.createdAt],
    ["Last updated", organization.updatedAt],
    ["Last activated", organization.activatedAt],
    ["Last suspended", organization.suspendedAt],
    ["Archived", organization.archivedAt],
  ] as const;
  return (
    <div className={styles.overview}>
      <section className={styles.section}>
        <div className={styles.heading}>
          <h3>Registry record</h3>
          <OrganizationStatusBadge status={organization.status} />
        </div>
        <dl className={styles.fields}>
          <div>
            <dt>Name</dt>
            <dd>{organization.name}</dd>
          </div>
          <div>
            <dt>Subdomain</dt>
            <dd>{organization.slug}</dd>
          </div>
          <div>
            <dt>Organization ID</dt>
            <dd className={styles.identifier}>{organization.id}</dd>
          </div>
        </dl>
      </section>
      <section className={styles.section}>
        <div className={styles.heading}>
          <h3>Lifecycle history</h3>
          <span className={styles.note}>Kigali time · UTC+2</span>
        </div>
        <dl className={styles.fields}>
          {timeline.map(([label, value]) =>
            value ? (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <time dateTime={value}>
                    {formatOrganizationDateTime(value)}
                  </time>
                </dd>
              </div>
            ) : null,
          )}
        </dl>
      </section>
      <OrganizationLifecycle
        organization={organization}
        permissions={permissions}
        onRefresh={onRefresh}
        onInteractionChange={onInteractionChange}
      />
    </div>
  );
}
