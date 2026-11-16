"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerOrganizationAction } from "@/app/(platform)/organizations/new/actions";
import { Button } from "@/components/shared/button";
import { Form } from "@/components/shared/form";
import { Icon } from "@/components/shared/icon";
import { Input } from "@/components/shared/input";
import { useToast } from "@/components/shared/toast";
import {
  suggestOrganizationSlug,
  validateOrganizationRegistration,
  type OrganizationRegistrationErrors,
} from "@/lib/organizations/contracts";
import styles from "./organization-registration-form.module.css";

export function OrganizationRegistrationForm() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState<OrganizationRegistrationErrors>({});

  function focusFirstError() {
    window.requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      );
      if (firstInvalid) firstInvalid.focus();
    });
  }

  async function submit(data: FormData) {
    const submittedName = String(data.get("name") ?? "");
    const submittedSlug = String(data.get("slug") ?? "");
    const fieldErrors = validateOrganizationRegistration(
      submittedName,
      submittedSlug,
    );
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      focusFirstError();
      toast.error("Review the highlighted fields.");
      return;
    }

    setErrors({});
    const result = await registerOrganizationAction(data);
    if (result.ok) {
      toast.success(
        "Organization registered successfully. It is pending approval.",
      );
      router.push(`/organizations/${result.organizationId}`);
      return;
    }
    if (result.kind === "unauthenticated") {
      router.replace("/login?expired=1&next=%2Forganizations%2Fnew");
      return;
    }
    setErrors(result.fieldErrors ?? {});
    if (result.fieldErrors) focusFirstError();
    if (result.kind === "uncertain")
      toast.show({ message: result.message, tone: "warning", duration: 0 });
    else toast.error(result.message);
  }

  return (
    <Form
      className={styles.form}
      onSubmitAction={submit}
      onErrorAction={() =>
        toast.error("We couldn't register the organization. Please try again.")
      }
      errorMessage="We couldn't confirm registration. Check the organization directory before trying again."
      noValidate
      aria-describedby="organization-registration-help"
    >
      <div className={styles.intro}>
        <span className={styles.eyebrow}>ORGANIZATION DETAILS</span>
        <h2>Set up the organization profile</h2>
        <p id="organization-registration-help">
          Register the organization using its official name and a unique
          subdomain. New registrations begin in pending approval.
        </p>
      </div>

      <div className={styles.fields}>
        <Input
          id="organization-name"
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
            if (!slugEdited) setSlug(suggestOrganizationSlug(nextName));
          }}
        />
        <Input
          id="organization-slug"
          name="slug"
          label="Organization subdomain"
          placeholder="e.g. musomesa"
          hint="Use lowercase letters and numbers, with single hyphens between words. The subdomain must be unique and cannot use a reserved name."
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

      <div className={styles.actions}>
        <Link className={styles.cancel} href="/organizations">
          Cancel
        </Link>
        <Button
          type="submit"
          icon={<Icon name="building" />}
          loadingLabel="Registering organization…"
        >
          Register organization
        </Button>
      </div>
    </Form>
  );
}
