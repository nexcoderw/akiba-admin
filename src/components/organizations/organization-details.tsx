import { Button } from "@/components/shared/button";
import { Dialog } from "@/components/shared/dialog";
import { Icon } from "@/components/shared/icon";
import type { Organization } from "@/lib/organizations/contracts";
import { formatOrganizationDateTime } from "./organization-dates";
import { OrganizationStatusBadge } from "./organization-status-badge";
import styles from "./organization-details.module.css";

/** Keep the authenticated registry snapshot stable while this read-only dialog is open. */
export function OrganizationDetails({
  organization,
  returnFocus,
  onClose,
  onEdit,
}: {
  organization: Organization;
  returnFocus?: HTMLElement | null;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const timeline = [
    ["Registered", organization.createdAt],
    ["Last updated", organization.updatedAt],
    ["Last activated", organization.activatedAt],
    ["Last suspended", organization.suspendedAt],
    ["Archived", organization.archivedAt],
  ] as const;
  return (
    <Dialog
      title={
        <span className={styles.title}>
          <Icon name="building" />
          <span>{organization.name}</span>
        </span>
      }
      returnFocus={returnFocus}
      onClose={onClose}
      footer={
        onEdit ? (
          <Button icon={<Icon name="pencil" />} onClick={onEdit}>
            Edit organization
          </Button>
        ) : undefined
      }
    >
      <div className={styles.details}>
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h3>Registry record</h3>
            <OrganizationStatusBadge status={organization.status} />
          </div>
          <dl className={styles.fields}>
            <div>
              <dt>Slug</dt>
              <dd>{organization.slug}</dd>
            </div>
            <div>
              <dt>Organization UUID</dt>
              <dd className={styles.identifier}>{organization.id}</dd>
            </div>
          </dl>
        </section>
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h3>Lifecycle dates</h3>
            <span className={styles.note}>Kigali time (UTC+2)</span>
          </div>
          <dl className={styles.timeline}>
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
      </div>
    </Dialog>
  );
}
