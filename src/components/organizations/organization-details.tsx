"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/shared/button";
import { Dialog } from "@/components/shared/dialog";
import { Icon } from "@/components/shared/icon";
import { OWNER_PERMISSIONS } from "@/lib/organizations/owner-invitations";
import type { Organization } from "@/lib/organizations/contracts";
import { OrganizationOverview } from "./organization-overview";
import { OrganizationOwnerInvitations } from "./organization-owner-invitations";
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
  const [tab, setTab] = useState<"details" | "owner">("details");
  const navigationRef = useRef<HTMLDivElement>(null);
  const detailsTab = useRef<HTMLButtonElement>(null);
  const ownerTab = useRef<HTMLButtonElement>(null);
  const canReadOwner = permissions.includes(OWNER_PERMISSIONS.read);
  const ownerSelected = canReadOwner && tab === "owner";

  function moveTabFocus(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const first = detailsTab.current;
    const last = canReadOwner ? ownerTab.current : first;
    switch (event.key) {
      case "Home":
        first?.focus();
        break;
      case "End":
        last?.focus();
        break;
      case "ArrowLeft":
      case "ArrowRight":
        (event.currentTarget === first ? last : first)?.focus();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  // Slides one shared pill under the active tab. Positions are written straight
  // to CSS variables, so there is no extra render and no layout flash.
  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;

    function place() {
      const active = navigation?.querySelector<HTMLElement>(
        '[aria-selected="true"]',
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
  }, [ownerSelected]);

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
      dismissible={!busy}
      footer={
        onEdit ? (
          <Button
            className={styles.edit}
            size="sm"
            icon={<Icon name="text" />}
            aria-label="Edit organization"
            onClick={onEdit}
            disabled={busy}
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
          role="tablist"
          aria-label="Organization views"
        >
          <span className={styles.pill} aria-hidden="true" />
          <button
            ref={detailsTab}
            id={`${id}-details-tab`}
            type="button"
            className={styles.tab}
            role="tab"
            aria-selected={!ownerSelected}
            aria-controls={`${id}-details`}
            tabIndex={ownerSelected ? -1 : 0}
            disabled={busy}
            onClick={() => setTab("details")}
            onKeyDown={moveTabFocus}
            data-autofocus
          >
            <Icon name="building" size={18} />
            <span>Organization details</span>
          </button>
          <button
            ref={ownerTab}
            id={`${id}-owner-tab`}
            type="button"
            className={styles.tab}
            role="tab"
            aria-selected={ownerSelected}
            aria-controls={`${id}-owner`}
            tabIndex={ownerSelected ? 0 : -1}
            disabled={busy || !canReadOwner}
            title={
              canReadOwner
                ? undefined
                : "You don't have permission to view owner invitations."
            }
            onClick={() => setTab("owner")}
            onKeyDown={moveTabFocus}
          >
            <Icon name="users" size={18} />
            <span>Organization owner</span>
          </button>
        </div>
        <section
          id={`${id}-details`}
          role="tabpanel"
          aria-labelledby={`${id}-details-tab`}
          hidden={ownerSelected}
          tabIndex={0}
          className={styles.panel}
        >
          {!ownerSelected && (
            <OrganizationOverview
              organization={organization}
              permissions={permissions}
              onRefresh={onRefresh}
              onInteractionChange={setBusy}
            />
          )}
        </section>
        <section
          id={`${id}-owner`}
          role="tabpanel"
          aria-labelledby={`${id}-owner-tab`}
          hidden={!ownerSelected}
          tabIndex={0}
          className={styles.panel}
        >
          {ownerSelected && (
            <OrganizationOwnerInvitations
              key={organization.id}
              organization={organization}
              permissions={permissions}
              onInteractionChange={setBusy}
            />
          )}
        </section>
      </div>
    </Dialog>
  );
}
