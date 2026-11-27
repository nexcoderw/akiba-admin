"use client";

import { useState } from "react";
import { Dialog } from "@/components/shared/dialog";
import type { Organization } from "@/lib/organizations/contracts";
import { OWNER_PERMISSIONS } from "@/lib/organizations/owner-invitations";
import { OrganizationOwnerInvitations } from "./organization-owner-invitations";

/** Shared by the details shortcut and the direct detail page entry point. */
export function OrganizationOwnerDialog({
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
      size="large"
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
        <p>You don&apos;t have permission to view owner invitations.</p>
      )}
    </Dialog>
  );
}
