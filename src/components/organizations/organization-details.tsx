"use client";

import { useId, useState } from "react";
import { Button } from "@/components/shared/button";
import { Dialog } from "@/components/shared/dialog";
import { Icon } from "@/components/shared/icon";
import { OWNER_PERMISSIONS } from "@/lib/organizations/owner-invitations";
import type { Organization } from "@/lib/organizations/contracts";
import { OrganizationOverview } from "./organization-overview";
import { OrganizationOwnerSheet } from "./organization-owner";
import styles from "./organization-details.module.css";

export function OrganizationDetails({
  organization,
  returnFocus,
  onClose,
  onEdit,
  permissions,
  onRefresh,
}: {
  organization: Organization;
  returnFocus?: HTMLElement | null;
  onClose: () => void;
  onEdit?: () => void;
  permissions: string[];
  onRefresh: () => void;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [ownerTrigger, setOwnerTrigger] = useState<HTMLElement | null>(null);
  const locked = busy || ownerTrigger !== null;
  const canReadOwner = permissions.includes(OWNER_PERMISSIONS.read);

  return (
    <Dialog
      title={
        <span className={styles.title}>
          <Icon name="building" />
          <span>{organization.name}</span>
        </span>
      }
      size="large"
      returnFocus={returnFocus}
      onClose={onClose}
      dismissible={!locked}
      footer={
        onEdit ? (
          <Button
            icon={<Icon name="text" />}
            onClick={onEdit}
            disabled={locked}
          >
            Edit organization
          </Button>
        ) : undefined
      }
    >
      <div className={styles.details}>
        <div
          className={styles.navigation}
          role="group"
          aria-label="Organization views"
        >
          <button
            type="button"
            className={styles.tab}
            data-active={ownerTrigger === null}
            aria-pressed={ownerTrigger === null}
            aria-controls={`${id}-details`}
            disabled={locked}
            onClick={() => document.getElementById(`${id}-details`)?.focus()}
          >
            <Icon name="building" size={18} />
            <span>Organization details</span>
          </button>
          <button
            type="button"
            className={styles.tab}
            data-active={ownerTrigger !== null}
            aria-haspopup="dialog"
            aria-expanded={ownerTrigger !== null}
            disabled={locked || !canReadOwner}
            title={
              canReadOwner
                ? undefined
                : "You don't have permission to view owner invitations."
            }
            onClick={(event) => setOwnerTrigger(event.currentTarget)}
          >
            <Icon name="users" size={18} />
            <span>Organization owner</span>
            <Icon name="arrow-right" size={14} />
          </button>
        </div>
        <section
          id={`${id}-details`}
          aria-label="Organization details"
          tabIndex={-1}
          className={styles.panel}
        >
          <OrganizationOverview
            organization={organization}
            permissions={permissions}
            onRefresh={onRefresh}
            onInteractionChange={setBusy}
          />
        </section>
      </div>
      {ownerTrigger && (
        <OrganizationOwnerSheet
          organization={organization}
          permissions={permissions}
          returnFocus={ownerTrigger}
          onClose={() => setOwnerTrigger(null)}
        />
      )}
    </Dialog>
  );
}
