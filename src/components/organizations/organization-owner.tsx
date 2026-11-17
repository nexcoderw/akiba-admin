"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/shared/button";
import { Dialog } from "@/components/shared/dialog";
import { Icon } from "@/components/shared/icon";
import { OWNER_PERMISSIONS } from "@/lib/organizations/owner-invitations";
import type { Organization } from "@/lib/organizations/contracts";
import { OrganizationOwnerInvitations } from "./organization-owner-invitations";
import styles from "./organization-owner.module.css";

export function OrganizationOwner({
  organization,
  permissions,
  onInteractionChange,
  headingLevel = 3,
}: {
  organization: Organization;
  permissions: string[];
  onInteractionChange?: (open: boolean) => void;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const canRead = permissions.includes(OWNER_PERMISSIONS.read);
  useEffect(() => {
    return () => {
      onInteractionChange?.(false);
    };
  }, [canRead, onInteractionChange]);

  function close() {
    setTrigger(null);
    onInteractionChange?.(false);
  }

  return (
    <section
      className={styles.owner}
      aria-label="Organization owner management"
    >
      <div className={styles.icon}>
        <Icon name="users" size={28} />
      </div>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>Owner management</span>
        <Heading>Manage owner invitations</Heading>
        <p>
          Review intended recipients, follow invitation progress, and manage
          delivery or revocation from the owner panel.
        </p>
      </div>
      <p className={styles.note}>
        Invitation acceptance does not confirm verified ownership, completed
        MFA, or organization readiness.
      </p>
      {canRead ? (
        <Button
          icon={<Icon name="arrow-right" />}
          onClick={(event) => {
            setTrigger(event.currentTarget);
            onInteractionChange?.(true);
          }}
        >
          Manage organization owner
        </Button>
      ) : (
        <p className={styles.note}>
          You don&apos;t have permission to view owner invitations.
        </p>
      )}
      {trigger && canRead && (
        <OrganizationOwnerSheet
          organization={organization}
          permissions={permissions}
          returnFocus={trigger}
          onClose={close}
        />
      )}
    </section>
  );
}

/** Shared by the details shortcut and the direct detail page entry point. */
export function OrganizationOwnerSheet({
  organization,
  permissions,
  returnFocus,
  onClose,
}: {
  organization: Organization;
  permissions: string[];
  returnFocus: HTMLElement;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const canRead = permissions.includes(OWNER_PERMISSIONS.read);
  return (
    <Dialog
      presentation="sheet"
      title="Organization owner"
      description={organization.name}
      returnFocus={returnFocus}
      dismissible={!busy}
      onClose={onClose}
    >
      {canRead ? (
        <OrganizationOwnerInvitations
          key={organization.id}
          organization={organization}
          permissions={permissions}
          onInteractionChange={setBusy}
        />
      ) : (
        <p className={styles.note}>
          You don&apos;t have permission to view owner invitations.
        </p>
      )}
    </Dialog>
  );
}
