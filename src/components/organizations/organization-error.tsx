"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import type { SafeProblem } from "@/lib/auth/contracts";
import styles from "./organization-error.module.css";

export function OrganizationError({ problem }: { problem: SafeProblem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const retryable = ![400, 403, 404].includes(problem.status);
  return (
    <section
      className={styles.error}
      role="alert"
      aria-labelledby="organization-error-title"
    >
      <span className={styles.icon}>
        <Icon name={problem.status === 403 ? "lock" : "warning"} />
      </span>
      <h2 id="organization-error-title">
        {problem.status === 403
          ? "Access denied"
          : problem.status === 404
            ? "Organization unavailable"
            : "Unable to load organizations"}
      </h2>
      <p>{problem.message}</p>
      {retryable && (
        <Button
          variant="secondary"
          pending={pending}
          loadingLabel="Loading organizations…"
          icon={<Icon name="arrow-right" />}
          onClick={() => startTransition(() => router.refresh())}
        >
          Try again
        </Button>
      )}
    </section>
  );
}
