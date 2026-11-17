import { useId } from "react";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import {
  deliveryLabels,
  type OwnerInvitation,
} from "@/lib/organizations/owner-invitations";
import { formatOrganizationDateTime } from "./organization-dates";
import styles from "./organization-owner-invitation-card.module.css";

const labels = {
  PENDING_DELIVERY: "Pending delivery",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REVOKED: "Revoked",
};

export function OrganizationOwnerInvitationCard({
  invitation,
  checkedAt,
  disabled,
  onDelivery,
  onRevoke,
}: {
  invitation: OwnerInvitation;
  checkedAt: number | null;
  disabled: boolean;
  onDelivery?: (trigger: HTMLElement) => void;
  onRevoke?: (trigger: HTMLElement) => void;
}) {
  const id = useId();
  const expired =
    invitation.status === "SENT" &&
    invitation.expiresAt !== null &&
    checkedAt !== null &&
    Date.parse(invitation.expiresAt) <= checkedAt;
  const dates = [
    ["Invited", invitation.createdAt],
    ["Sent", invitation.sentAt],
    ["Expires", invitation.expiresAt],
    ["Accepted", invitation.acceptedAt],
    ["Revoked", invitation.revokedAt],
  ] as const;
  return (
    <article className={styles.card} aria-labelledby={`${id}-name`}>
      <header className={styles.header}>
        <Avatar name={invitation.displayName} shape="rounded" />
        <div className={styles.identity}>
          <h4 id={`${id}-name`}>{invitation.displayName}</h4>
          <p>
            <Icon name="email" size={14} />
            <span>{invitation.email}</span>
          </p>
        </div>
        <span className={styles.badge} data-status={invitation.status}>
          <span className={styles.dot} aria-hidden="true" />
          {labels[invitation.status]}
        </span>
      </header>
      <div
        className={styles.delivery}
        data-status={invitation.deliveryStatus ?? "NONE"}
      >
        <Icon
          name={
            invitation.deliveryStatus === "FAILED" ||
            invitation.deliveryStatus === "UNCERTAIN"
              ? "warning"
              : "info"
          }
          size={18}
        />
        <div>
          <span className={styles.caption}>Email delivery</span>
          <p>
            {invitation.deliveryStatus
              ? deliveryLabels[invitation.deliveryStatus]
              : "Not requested"}
          </p>
        </div>
      </div>
      <dl className={styles.dates}>
        {dates.map(([label, value]) =>
          value || label === "Expires" ? (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {value ? (
                  <time dateTime={value}>
                    {formatOrganizationDateTime(value)}
                  </time>
                ) : (
                  "Not issued yet"
                )}
              </dd>
            </div>
          ) : null,
        )}
      </dl>
      {expired && (
        <p className={styles.notice}>
          The recorded expiry had passed at the last refresh. The stored status
          is still Sent.
        </p>
      )}
      {(onDelivery || onRevoke) && (
        <footer className={styles.actions}>
          {onDelivery && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Icon name="email" />}
              disabled={disabled}
              onClick={(event) => onDelivery(event.currentTarget)}
            >
              Request delivery
            </Button>
          )}
          {onRevoke && (
            <Button
              size="sm"
              variant="danger"
              icon={<Icon name="close" />}
              disabled={disabled}
              onClick={(event) => onRevoke(event.currentTarget)}
            >
              Revoke invitation
            </Button>
          )}
        </footer>
      )}
    </article>
  );
}
