"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/button";
import { Dialog } from "@/components/shared/dialog";
import { Icon } from "@/components/shared/icon";
import { useToast } from "@/components/shared/toast";
import { suspendOrganizationAction } from "@/lib/organizations/lifecycle-actions";
import { lifecycleAvailability } from "@/lib/organizations/lifecycle";
import type { Organization } from "@/lib/organizations/contracts";
import styles from "./organization-lifecycle.module.css";

export function OrganizationLifecycle({
  organization,
  permissions,
  onRefresh,
  onInteractionChange,
}: {
  organization: Organization;
  permissions: string[];
  onRefresh?: () => void;
  onInteractionChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const locked = useRef(false);
  const [pending, startTransition] = useTransition();
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const availability = lifecycleAvailability(organization.status, permissions);

  function close() {
    if (locked.current) return;
    setTrigger(null);
    onInteractionChange?.(false);
    if (error) refresh();
  }

  function refresh() {
    setTrigger(null);
    onInteractionChange?.(false);
    if (onRefresh) onRefresh();
    else startTransition(() => router.refresh());
  }

  function confirm() {
    if (locked.current || error) return;
    locked.current = true;
    startTransition(async () => {
      try {
        const result = await suspendOrganizationAction({
          id: organization.id,
          updatedAt: organization.updatedAt,
        });
        if (result.kind === "unauthenticated") {
          router.replace("/login?expired=1&next=%2Forganizations");
          return;
        }
        if (result.kind === "success") {
          toast.success("Organization suspended successfully.");
          refresh();
        } else {
          setError(result.problem.message);
          toast.error(result.problem.message);
        }
      } catch {
        const message =
          "We couldn't confirm the change. Refresh the organization to check its status before trying again.";
        setError(message);
        toast.error(message);
      } finally {
        locked.current = false;
      }
    });
  }

  return (
    <section className={styles.lifecycle} aria-label="Organization lifecycle">
      {availability.unavailable && (
        <p className={styles.note}>{availability.unavailable}</p>
      )}
      {availability.canSuspend && (
        <Button
          variant="danger"
          icon={<Icon name="lock" />}
          disabled={pending}
          onClick={(event) => {
            setError(null);
            setTrigger(event.currentTarget);
            onInteractionChange?.(true);
          }}
        >
          Suspend organization
        </Button>
      )}
      {trigger && (
        <Dialog
          title={`Suspend ${organization.name}?`}
          description="Suspending this organization prevents ordinary organization access. Reactivation is currently unavailable while onboarding readiness checks are incomplete."
          returnFocus={trigger}
          dismissible={!pending}
          onClose={close}
          size="small"
        >
          <div className={styles.confirmation}>
            <p>
              Review this change carefully. Organization data will be retained.
            </p>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <div className={styles.actions}>
              <Button
                variant="secondary"
                icon={<Icon name="close" />}
                disabled={pending}
                onClick={close}
                data-autofocus
              >
                {error ? "Close and refresh" : "Cancel"}
              </Button>
              {!error && (
                <Button
                  variant="danger"
                  icon={<Icon name="lock" />}
                  pending={pending}
                  loadingLabel="Suspending organization…"
                  onClick={confirm}
                >
                  Suspend organization
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </section>
  );
}
