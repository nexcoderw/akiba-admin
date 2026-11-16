"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/button";
import { Dialog } from "@/components/shared/dialog";
import { Form } from "@/components/shared/form";
import { Input } from "@/components/shared/input";
import { Icon } from "@/components/shared/icon";
import { EmptyState } from "@/components/shared/empty-state";
import { StatePanel } from "@/components/shared/state-panel";
import { useToast } from "@/components/shared/toast";
import { ownerInvitationAction } from "@/lib/organizations/owner-invitation-actions";
import {
  OWNER_PERMISSIONS,
  ownerInvitationAvailability,
  deliveryLabels,
  validateOwnerInvite,
  type InvitationCommand,
  type InvitationPage,
  type OwnerInvitation,
} from "@/lib/organizations/owner-invitations";
import type { OwnerInvitationResult } from "@/lib/organizations/owner-invitation-service";
import type { Organization } from "@/lib/organizations/contracts";
import { formatOrganizationDateTime } from "./organization-dates";
import styles from "./organization-owner-invitations.module.css";

type Modal =
  | { kind: "create"; trigger: HTMLElement }
  | {
      kind: "revoke" | "delivery";
      invitation: OwnerInvitation;
      trigger: HTMLElement;
    };
const labels = {
  PENDING_DELIVERY: "Pending delivery",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REVOKED: "Revoked",
};

export function OrganizationOwnerInvitations({
  organization,
  permissions,
  disabled = false,
  onInteractionChange,
}: {
  organization: Organization;
  permissions: string[];
  disabled?: boolean;
  onInteractionChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const id = useId();
  const sequence = useRef(0);
  const locked = useRef(false);
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<{
    organizationId: string;
    page: InvitationPage | null;
    error?: string;
  } | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [history, setHistory] = useState<(string | undefined)[]>([undefined]);
  const [modal, setModal] = useState<Modal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshRequired, setRefreshRequired] = useState(false);
  const [fields, setFields] = useState<{
    displayName?: string;
    email?: string;
  }>({});
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const canRead = permissions.includes(OWNER_PERMISSIONS.read);
  const eligible =
    organization.status === "PENDING" || organization.status === "ACTIVE";
  const page = data?.organizationId === organization.id ? data.page : null;
  const cursor = history.at(-1);

  useEffect(() => {
    return () => {
      onInteractionChange?.(false);
    };
  }, [canRead, onInteractionChange]);

  const applyRead = useCallback(
    (result: OwnerInvitationResult) => {
      if (result.kind === "unauthenticated") {
        router.replace("/login?expired=1&next=%2Forganizations");
      } else if (result.kind === "page") {
        setData({ organizationId: organization.id, page: result.page });
        setCheckedAt(Date.now());
      } else {
        setData({
          organizationId: organization.id,
          page: null,
          error:
            result.kind === "error"
              ? result.problem.message
              : "We couldn't load invitation information.",
        });
      }
    },
    [organization.id, router],
  );

  useEffect(() => {
    if (!canRead) return;
    const request = ++sequence.current;
    startTransition(async () => {
      try {
        const result = await ownerInvitationAction({
          operation: "list",
          organizationId: organization.id,
        });
        if (sequence.current === request) applyRead(result);
      } catch {
        if (sequence.current === request)
          setData({
            organizationId: organization.id,
            page: null,
            error:
              "We couldn't load invitations. Check your connection and refresh.",
          });
      }
    });
    return () => {
      sequence.current++;
    };
  }, [organization.id, canRead, applyRead, startTransition]);

  async function read(nextHistory: (string | undefined)[]) {
    const request = ++sequence.current;
    try {
      const result = await ownerInvitationAction({
        operation: "list",
        organizationId: organization.id,
        cursor: nextHistory.at(-1),
      });
      if (sequence.current !== request) return;
      applyRead(result);
      if (result.kind === "page") {
        setHistory(nextHistory);
        setRefreshRequired(false);
      }
    } catch {
      if (sequence.current === request)
        setData({
          organizationId: organization.id,
          page: null,
          error:
            "We couldn't load invitations. Check your connection and refresh.",
        });
    }
  }

  function refresh() {
    if (locked.current) return;
    startTransition(() => read([undefined]));
  }

  function open(next: Modal) {
    if (pending || locked.current || disabled || refreshRequired || !page)
      return;
    setModal(next);
    setError(null);
    setFields({});
    setDisplayName("");
    setEmail("");
    onInteractionChange?.(true);
  }

  function close() {
    if (locked.current) return;
    setModal(null);
    onInteractionChange?.(false);
    if (refreshRequired) refresh();
  }

  async function mutate(command: InvitationCommand) {
    if (locked.current || refreshRequired) return;
    locked.current = true;
    const mutationSequence = sequence.current;
    try {
      const result = await ownerInvitationAction(command);
      if (sequence.current !== mutationSequence) return;
      if (result.kind === "unauthenticated") {
        router.replace("/login?expired=1&next=%2Forganizations");
        return;
      }
      if (result.kind === "error") {
        setError(result.problem.message);
        setRefreshRequired(result.refreshRequired);
        toast.error(result.problem.message);
        return;
      }
      if (result.kind === "invitation") {
        toast.success(
          command.operation === "create"
            ? "Owner invitation created. Email delivery has not been requested."
            : "Owner invitation revoked.",
        );
      } else if (result.kind === "delivery") {
        const message = deliveryLabels[result.status];
        if (result.status === "FAILED" || result.status === "UNCERTAIN")
          toast.warning(message);
        else
          toast.info(
            result.status === "CONFIRMED"
              ? message
              : `${message}. This does not confirm inbox receipt.`,
          );
      } else throw new Error("Unexpected invitation outcome.");
      setModal(null);
      onInteractionChange?.(false);
      const update = read(
        command.operation === "create" ? [undefined] : history,
      );
      const readSequence = sequence.current;
      await update;
      if (sequence.current !== readSequence) return;
      router.refresh();
      requestAnimationFrame(() =>
        document.getElementById(`${id}-title`)?.focus(),
      );
    } catch {
      if (sequence.current !== mutationSequence) return;
      const message =
        "We couldn't confirm this request. Refresh invitation status before trying again.";
      setError(message);
      setRefreshRequired(true);
      toast.error(message);
    } finally {
      locked.current = false;
    }
  }

  async function create(form: FormData) {
    const name = form.get("displayName");
    const address = form.get("email");
    const errors = validateOwnerInvite(name, address);
    if (Object.keys(errors).length) {
      setFields(errors);
      toast.error("Review the highlighted fields.");
      requestAnimationFrame(() =>
        document
          .getElementById(errors.displayName ? `${id}-name` : `${id}-email`)
          ?.focus(),
      );
      return;
    }
    if (typeof name !== "string" || typeof address !== "string") return;
    await mutate({
      operation: "create",
      organizationId: organization.id,
      displayName: name,
      email: address,
    });
  }

  function confirmSelected() {
    if (!modal || modal.kind === "create") return;
    const command: InvitationCommand = {
      operation: modal.kind,
      organizationId: organization.id,
      invitationId: modal.invitation.id,
      cursor,
    };
    startTransition(() => mutate(command));
  }

  function submitCreate(form: FormData): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await create(form);
          resolve();
        } catch (cause) {
          reject(cause);
        }
      });
    });
  }

  if (!canRead) return null;
  return (
    <section className={styles.section} aria-labelledby={`${id}-title`}>
      <header className={styles.header}>
        <h3 id={`${id}-title`} tabIndex={-1}>
          Organization Owner
        </h3>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name="refresh" />}
          pending={pending}
          disabled={disabled || modal !== null}
          loadingLabel="Refreshing owner invitations…"
          onClick={refresh}
        >
          Refresh
        </Button>
      </header>
      <p className={styles.note}>
        Invitation records show the intended recipient. Verified owner identity,
        enrollment progress and MFA readiness are not available here.
      </p>
      {!eligible && (
        <p className={styles.notice}>
          New invitations and delivery requests are unavailable while this
          organization is suspended or archived.
        </p>
      )}
      {(pending && modal === null) || data === null ? (
        <StatePanel
          kind="loading"
          layout="compact"
          headingLevel={3}
          title="Loading owner invitations…"
        />
      ) : data.error ? (
        <p className={styles.error} role="alert">
          {data.error}
        </p>
      ) : (
        page && (
          <>
            {ownerInvitationAvailability(organization.status, permissions)
              .create && (
              <Button
                icon={<Icon name="email" />}
                disabled={disabled || refreshRequired || modal !== null}
                onClick={(event) =>
                  open({ kind: "create", trigger: event.currentTarget })
                }
              >
                Invite initial Owner
              </Button>
            )}
            {page.items.length === 0 ? (
              <EmptyState
                icon="email"
                title="No owner invitations in this view"
                description="Invitation records will appear here after they are created. This does not establish whether the organization has an active owner."
              />
            ) : (
              <ul className={styles.list}>
                {page.items.map((invitation) => (
                  <li key={invitation.id} className={styles.card}>
                    <div className={styles.header}>
                      <strong>{invitation.displayName}</strong>
                      <span
                        className={styles.badge}
                        data-status={invitation.status}
                      >
                        {labels[invitation.status]}
                      </span>
                    </div>
                    <p className={styles.email}>{invitation.email}</p>
                    <dl className={styles.metadata}>
                      <div>
                        <dt>Invited</dt>
                        <dd>
                          {formatOrganizationDateTime(invitation.createdAt)}
                        </dd>
                      </div>
                      <div>
                        <dt>Delivery</dt>
                        <dd>
                          {invitation.deliveryStatus
                            ? deliveryLabels[invitation.deliveryStatus]
                            : "Not requested"}
                        </dd>
                      </div>
                      {invitation.sentAt && (
                        <div>
                          <dt>Sent</dt>
                          <dd>
                            {formatOrganizationDateTime(invitation.sentAt)}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt>Expires</dt>
                        <dd>
                          {invitation.expiresAt
                            ? formatOrganizationDateTime(invitation.expiresAt)
                            : "Not issued yet"}
                        </dd>
                      </div>
                      {invitation.acceptedAt && (
                        <div>
                          <dt>Accepted</dt>
                          <dd>
                            {formatOrganizationDateTime(invitation.acceptedAt)}
                          </dd>
                        </div>
                      )}
                      {invitation.revokedAt && (
                        <div>
                          <dt>Revoked</dt>
                          <dd>
                            {formatOrganizationDateTime(invitation.revokedAt)}
                          </dd>
                        </div>
                      )}
                    </dl>
                    {invitation.status === "SENT" &&
                      invitation.expiresAt &&
                      checkedAt !== null &&
                      Date.parse(invitation.expiresAt) <= checkedAt && (
                        <p className={styles.notice}>
                          At the last refresh, the recorded expiration time had
                          passed. The stored invitation status is still Sent.
                        </p>
                      )}
                    <div className={styles.actions}>
                      {ownerInvitationAvailability(
                        organization.status,
                        permissions,
                        invitation,
                      ).delivery && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Icon name="email" />}
                          disabled={
                            disabled || refreshRequired || modal !== null
                          }
                          onClick={(event) =>
                            open({
                              kind: "delivery",
                              invitation,
                              trigger: event.currentTarget,
                            })
                          }
                        >
                          Request delivery
                        </Button>
                      )}
                      {ownerInvitationAvailability(
                        organization.status,
                        permissions,
                        invitation,
                      ).revoke && (
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<Icon name="close" />}
                          disabled={
                            disabled || refreshRequired || modal !== null
                          }
                          onClick={(event) =>
                            open({
                              kind: "revoke",
                              invitation,
                              trigger: event.currentTarget,
                            })
                          }
                        >
                          Revoke invitation
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <nav className={styles.actions} aria-label="Owner invitation pages">
              <Button
                variant="secondary"
                size="sm"
                icon={<Icon name="arrow-left" />}
                disabled={disabled || history.length < 2 || modal !== null}
                onClick={() =>
                  startTransition(() => read(history.slice(0, -1)))
                }
              >
                Previous
              </Button>
              <span>Page {history.length}</span>
              <Button
                variant="secondary"
                size="sm"
                icon={<Icon name="arrow-right" />}
                disabled={
                  disabled ||
                  !page.nextCursor ||
                  history.length >= 20 ||
                  modal !== null
                }
                onClick={() => {
                  if (page.nextCursor)
                    startTransition(() =>
                      read([...history, page.nextCursor ?? undefined]),
                    );
                }}
              >
                Next
              </Button>
            </nav>
            {history.length >= 20 && page.nextCursor && (
              <p className={styles.note}>
                Refresh to restart this bounded navigation history.
              </p>
            )}
          </>
        )
      )}
      <p className={styles.note}>
        Dates use Kigali time. Email delivery may be unavailable. Resend and
        reissue are not supported; failed or uncertain delivery needs operator
        review. Accepted invitations do not prove owner MFA or organization
        readiness.
      </p>
      {modal && (
        <Dialog
          title={
            modal.kind === "create"
              ? "Invite initial Organization Owner"
              : modal.kind === "revoke"
                ? "Revoke this owner invitation?"
                : "Request invitation delivery?"
          }
          description={
            modal.kind === "create"
              ? "Create an invitation record for this organization. This does not send email or activate owner access."
              : modal.kind === "revoke"
                ? "The recipient will no longer be able to use this invitation to complete enrollment. Existing memberships are not changed."
                : "Reserve delivery to the recorded recipient. This does not resend an existing proof or confirm inbox receipt."
          }
          returnFocus={modal.trigger}
          dismissible={!pending}
          onClose={close}
        >
          {modal.kind === "create" ? (
            <Form
              className={styles.form}
              onErrorAction={() => {
                setRefreshRequired(true);
                setError(
                  "We couldn't confirm the request. Close and refresh before trying again.",
                );
                toast.error(
                  "We couldn't confirm the request. Close and refresh before trying again.",
                );
              }}
              onSubmitAction={submitCreate}
              noValidate
            >
              <Input
                id={`${id}-name`}
                name="displayName"
                label="Owner name"
                placeholder="e.g. Aline Uwase"
                autoComplete="name"
                icon={<Icon name="user" />}
                required
                maxLength={160}
                value={displayName}
                disabled={pending}
                error={fields.displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setFields((value) => ({ ...value, displayName: undefined }));
                }}
                data-autofocus
              />
              <Input
                id={`${id}-email`}
                name="email"
                type="email"
                label="Owner email address"
                placeholder="e.g. aline@example.com"
                autoComplete="email"
                icon={<Icon name="email" />}
                required
                maxLength={254}
                value={email}
                disabled={pending}
                error={fields.email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFields((value) => ({ ...value, email: undefined }));
                }}
              />
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
                >
                  {refreshRequired ? "Close and refresh" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  icon={<Icon name="email" />}
                  disabled={refreshRequired}
                  loadingLabel="Creating owner invitation…"
                >
                  Create invitation
                </Button>
              </div>
            </Form>
          ) : (
            <div className={styles.form}>
              <p className={styles.email}>{modal.invitation.email}</p>
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
                  {refreshRequired ? "Close and refresh" : "Cancel"}
                </Button>
                <Button
                  variant={modal.kind === "revoke" ? "danger" : "primary"}
                  icon={
                    <Icon name={modal.kind === "revoke" ? "close" : "email"} />
                  }
                  pending={pending}
                  disabled={refreshRequired}
                  loadingLabel={
                    modal.kind === "revoke"
                      ? "Revoking invitation…"
                      : "Requesting delivery…"
                  }
                  onClick={confirmSelected}
                >
                  {modal.kind === "revoke"
                    ? "Revoke invitation"
                    : "Request delivery"}
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      )}
    </section>
  );
}
