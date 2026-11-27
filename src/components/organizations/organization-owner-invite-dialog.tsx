"use client";

import { useId, useState } from "react";
import { Button } from "@/components/shared/button";
import { Dialog } from "@/components/shared/dialog";
import { Form } from "@/components/shared/form";
import { Icon } from "@/components/shared/icon";
import { Input } from "@/components/shared/input";
import { useToast } from "@/components/shared/toast";
import { validateOwnerInvite } from "@/lib/organizations/owner-invitations";
import styles from "./organization-owner-invite-dialog.module.css";

export function OrganizationOwnerInviteDialog({
  returnFocus,
  pending,
  error,
  refreshRequired,
  onClose,
  onSubmit,
  onError,
}: {
  returnFocus: HTMLElement;
  pending: boolean;
  error: string | null;
  refreshRequired: boolean;
  onClose: () => void;
  onSubmit: (displayName: string, email: string) => Promise<void>;
  onError: () => void;
}) {
  const id = useId();
  const toast = useToast();
  const [fields, setFields] = useState<ReturnType<typeof validateOwnerInvite>>(
    {},
  );

  async function submit(form: FormData) {
    const name = form.get("displayName");
    const email = form.get("email");
    const errors = validateOwnerInvite(name, email);
    if (errors.displayName || errors.email) {
      setFields(errors);
      toast.error("Review the highlighted fields.");
      const field = errors.displayName ? "name" : "email";
      requestAnimationFrame(() =>
        document.getElementById(`${id}-${field}`)?.focus(),
      );
      return;
    }
    if (typeof name === "string" && typeof email === "string")
      await onSubmit(name, email);
  }

  return (
    <Dialog
      title="Invite initial organization owner"
      description="Create an invitation for this organization. You can request email delivery after creating it."
      returnFocus={returnFocus}
      dismissible={!pending}
      onClose={onClose}
    >
      <Form
        className={styles.form}
        onSubmitAction={submit}
        onErrorAction={onError}
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
          disabled={pending}
          error={fields.displayName}
          onChange={() =>
            setFields((value) => ({ ...value, displayName: undefined }))
          }
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
          disabled={pending}
          error={fields.email}
          onChange={() =>
            setFields((value) => ({ ...value, email: undefined }))
          }
        />
        {error && (
          <p className={styles.error} role="alert">
            <Icon name="error" />
            <span>{error}</span>
          </p>
        )}
        <div className={styles.actions}>
          <Button
            variant="secondary"
            icon={<Icon name="close" />}
            disabled={pending}
            onClick={onClose}
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
    </Dialog>
  );
}
