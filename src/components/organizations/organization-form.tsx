"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { saveOrganizationAction } from "@/lib/organizations/actions";
import { Dialog } from "@/components/shared/dialog";
import { Button } from "@/components/shared/button";
import { Form } from "@/components/shared/form";
import { Icon } from "@/components/shared/icon";
import { Input } from "@/components/shared/input";
import { useToast } from "@/components/shared/toast";
import {
  suggestOrganizationSlug,
  validateOrganizationRegistration,
  validateOrganizationName,
  type Organization,
  type OrganizationRegistrationErrors,
} from "@/lib/organizations/contracts";
import styles from "./organization-form.module.css";

export function OrganizationForm({
  organization,
  returnFocus,
  onClose,
  onSaved,
}: {
  organization?: Organization;
  returnFocus: HTMLElement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const id = useId();
  const [refreshRequired, setRefreshRequired] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const editing = organization !== undefined;
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(organization?.name ?? "");
  const [slug, setSlug] = useState(organization?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState<OrganizationRegistrationErrors>({});

  function close() {
    if (refreshRequired) onSaved();
    else onClose();
  }

  function focusFirstError() {
    window.requestAnimationFrame(() => {
      const firstInvalid = document
        .getElementById(`${id}-name`)
        ?.closest("form")
        ?.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
    });
  }

  async function submit(data: FormData) {
    if (refreshRequired) return;
    setSaveError(null);
    const submittedName = String(data.get("name") ?? "");
    const submittedSlug = editing
      ? organization.slug
      : String(data.get("slug") ?? "");
    const fieldErrors = editing
      ? validateOrganizationName(submittedName)
      : validateOrganizationRegistration(submittedName, submittedSlug);
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      focusFirstError();
      toast.error("Review the highlighted fields.");
      return;
    }

    setErrors({});
    setPending(true);
    let result;
    try {
      result = await saveOrganizationAction(
        data,
        organization
          ? { id: organization.id, updatedAt: organization.updatedAt }
          : undefined,
      );
    } finally {
      setPending(false);
    }
    if (result.ok) {
      toast.success(
        editing
          ? "Organization updated successfully."
          : "Organization registered successfully. It is pending approval.",
      );
      onSaved();
      return;
    }
    if (result.kind === "unauthenticated") {
      router.replace("/login?expired=1&next=%2Forganizations");
      return;
    }
    setSaveError(result.message);
    if (result.kind === "uncertain" || (editing && result.kind === "conflict"))
      setRefreshRequired(true);
    setErrors(result.fieldErrors ?? {});
    if (result.fieldErrors) focusFirstError();
    if (result.kind === "uncertain")
      toast.show({ message: result.message, tone: "warning", duration: 0 });
    else toast.error(result.message);
  }

  return (
    <Dialog
      title={editing ? "Edit organization" : "Add organization"}
      description={
        editing
          ? "Update the organization name. Its subdomain stays unchanged."
          : "Register an organization for review and approval."
      }
      dismissible={!pending}
      returnFocus={returnFocus}
      onClose={close}
    >
      <Form
        className={styles.form}
        onSubmitAction={submit}
        onErrorAction={() => {
          setRefreshRequired(true);
          setSaveError(
            "Refresh the directory to check the outcome before trying again.",
          );
          toast.error(
            "We couldn't save the organization. Check its status before trying again.",
          );
        }}
        errorMessage="We couldn't confirm this save. Check the organization directory before trying again."
        noValidate
        aria-describedby={`${id}-help`}
      >
        <p id={`${id}-help`} className={styles.help}>
          {editing
            ? "Changes apply to the organization profile only."
            : "Use the official name and a unique subdomain. New organizations start pending approval."}
        </p>
        <div className={styles.fields}>
          <Input
            id={`${id}-name`}
            data-autofocus
            disabled={pending}
            name="name"
            label="Organization name"
            placeholder="e.g. Musomesa Ltd"
            autoComplete="organization"
            maxLength={160}
            required
            icon={<Icon name="building" />}
            value={name}
            error={errors.name}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);
              setErrors((current) => ({ ...current, name: undefined }));
              if (!editing && !slugEdited)
                setSlug(suggestOrganizationSlug(nextName));
            }}
          />
          <Input
            id={`${id}-slug`}
            readOnly={editing}
            disabled={pending}
            name={editing ? undefined : "slug"}
            label="Organization subdomain"
            placeholder="e.g. musomesa"
            hint={
              editing
                ? "The subdomain cannot be changed."
                : "Use lowercase letters, numbers, and single hyphens. Choose a unique, non-reserved name."
            }
            autoComplete="off"
            spellCheck={false}
            minLength={3}
            maxLength={63}
            required
            icon={<Icon name="link" />}
            value={slug}
            error={errors.slug}
            aria-invalid={Boolean(errors.slug)}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.target.value);
              setErrors((current) => ({ ...current, slug: undefined }));
            }}
          />
        </div>

        {saveError && (
          <p className={styles.error} role="alert">
            {saveError}
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
            disabled={refreshRequired}
            icon={<Icon name="building" />}
            loadingLabel={
              editing ? "Saving organization…" : "Registering organization…"
            }
          >
            {editing ? "Save changes" : "Add organization"}
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}
