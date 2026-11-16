import { Avatar } from "@/components/shared/avatar";
import { Icon } from "@/components/shared/icon";
import type { Organization } from "@/lib/organizations/contracts";
import { formatOrganizationDate } from "./organization-dates";
import { OrganizationStatusBadge } from "./organization-status-badge";
import styles from "./organization-card.module.css";

export function OrganizationCard({
  organization,
  onOpen,
}: {
  organization: Organization;
  onOpen: (trigger: HTMLElement) => void;
}) {
  const nameId = `organization-${organization.id}-name`;
  return (
    <article className={styles.card} aria-labelledby={nameId}>
      <div className={styles.top}>
        <Avatar name={organization.name} shape="rounded" />
        <OrganizationStatusBadge status={organization.status} />
      </div>
      <div className={styles.identity}>
        <h2 id={nameId} className={styles.name}>
          <button
            type="button"
            className={styles.open}
            aria-haspopup="dialog"
            onClick={(event) => onOpen(event.currentTarget)}
          >
            {organization.name}
          </button>
        </h2>
        <p className={styles.slug}>
          <Icon name="link" size={14} />
          <span>{organization.slug}</span>
        </p>
      </div>
      <dl className={styles.meta}>
        <div>
          <dt>Registered</dt>
          <dd>
            <time dateTime={organization.createdAt}>
              {formatOrganizationDate(organization.createdAt)}
            </time>
          </dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>
            <time dateTime={organization.updatedAt}>
              {formatOrganizationDate(organization.updatedAt)}
            </time>
          </dd>
        </div>
      </dl>
      <div className={styles.footer}>
        <span className={styles.cue} aria-hidden="true">
          Details <Icon name="arrow-right" size={16} />
        </span>
      </div>
    </article>
  );
}
