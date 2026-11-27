"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/button";
import { Dialog } from "@/components/shared/dialog";
import { Icon } from "@/components/shared/icon";
import { OWNER_PERMISSIONS } from "@/lib/organizations/owner-invitations";
import type { Organization } from "@/lib/organizations/contracts";
import { OrganizationOverview } from "./organization-overview";
import { OrganizationOwnerDialog } from "./organization-owner-dialog";
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
  const navigationRef = useRef<HTMLDivElement>(null);
  const locked = busy || ownerTrigger !== null;
  const ownerOpen = ownerTrigger !== null;
  const canReadOwner = permissions.includes(OWNER_PERMISSIONS.read);

  // Slides one shared pill under the active tab. Positions are written straight
  // to CSS variables, so there is no extra render and no layout flash.
  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;

    function place() {
      const active = navigation?.querySelector<HTMLElement>(
        '[data-active="true"]',
      );
      if (!navigation || !active) return;
      navigation.style.setProperty("--pill-x", `${active.offsetLeft}px`);
      navigation.style.setProperty("--pill-y", `${active.offsetTop}px`);
      navigation.style.setProperty("--pill-w", `${active.offsetWidth}px`);
      navigation.style.setProperty("--pill-h", `${active.offsetHeight}px`);
      navigation.setAttribute("data-placed", "");
    }

    place();
    // Enable the slide only after the first placement, so it doesn't animate in from 0.
    const frame = requestAnimationFrame(() =>
      navigation.setAttribute("data-ready", ""),
    );
    const observer = new ResizeObserver(place);
    observer.observe(navigation);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ownerOpen]);

  return (
    <Dialog
      title={
        <span className={styles.title}>
          <span className={styles.titleIcon} aria-hidden="true">
            <Icon name="building" />
          </span>
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
            className={styles.edit}
            size="sm"
            icon={<Icon name="text" />}
            aria-label="Edit organization"
            onClick={onEdit}
            disabled={locked}
          >
            Edit
          </Button>
        ) : undefined
      }
    >
      <div className={styles.details}>
        <div
          ref={navigationRef}
          className={styles.navigation}
          role="group"
          aria-label="Organization views"
        >
          <span className={styles.pill} aria-hidden="true" />
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
            <span className={styles.arrow}>
              <Icon name="arrow-right" size={14} />
            </span>
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
        <OrganizationOwnerDialog
          organization={organization}
          permissions={permissions}
          returnFocus={ownerTrigger}
          onClose={() => setOwnerTrigger(null)}
        />
      )}
    </Dialog>
  );
}
