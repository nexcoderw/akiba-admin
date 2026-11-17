"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/shared/button";
import { Dialog } from "@/components/shared/dialog";
import { Icon } from "@/components/shared/icon";
import type { Organization } from "@/lib/organizations/contracts";
import { OrganizationOverview } from "./organization-overview";
import { OrganizationOwner } from "./organization-owner";
import styles from "./organization-details.module.css";

const tabs = [
  { id: "details", label: "Organization details", icon: "building" },
  { id: "owner", label: "Organization owner", icon: "users" },
] as const;

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
  const [active, setActive] = useState<"details" | "owner">("details");
  const [busy, setBusy] = useState(false);

  function navigateTabs(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (busy) return;
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(tabs[next].id);
    event.currentTarget
      .closest('[role="tablist"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus();
  }

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
      dismissible={!busy}
      footer={
        active === "details" && onEdit ? (
          <Button icon={<Icon name="text" />} onClick={onEdit} disabled={busy}>
            Edit organization
          </Button>
        ) : undefined
      }
    >
      <div className={styles.details}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Organization information"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${id}-${tab.id}-tab`}
              aria-controls={`${id}-${tab.id}-panel`}
              aria-selected={active === tab.id}
              tabIndex={active === tab.id ? 0 : -1}
              className={styles.tab}
              disabled={busy}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => navigateTabs(event, index)}
            >
              <Icon name={tab.icon} size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={`${id}-details-panel`}
          aria-labelledby={`${id}-details-tab`}
          hidden={active !== "details"}
          tabIndex={0}
          className={styles.panel}
        >
          {active === "details" && (
            <OrganizationOverview
              organization={organization}
              permissions={permissions}
              onRefresh={onRefresh}
              onInteractionChange={setBusy}
            />
          )}
        </div>
        <div
          role="tabpanel"
          id={`${id}-owner-panel`}
          aria-labelledby={`${id}-owner-tab`}
          hidden={active !== "owner"}
          tabIndex={0}
          className={styles.panel}
        >
          {active === "owner" && (
            <OrganizationOwner
              key={organization.id}
              organization={organization}
              permissions={permissions}
              onInteractionChange={setBusy}
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}
