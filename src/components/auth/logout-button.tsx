"use client";

import { useState } from "react";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import { AuthRequestError, endSession } from "@/lib/auth/browser";
import styles from "./logout-button.module.css";

export function LogoutButton({
  label = "Sign out",
  disabled,
}: {
  label?: string;
  disabled?: boolean;
}) {
  const [error, setError] = useState<string>();
  return (
    <div className={styles.action}>
      <Button
        variant="secondary"
        disabled={disabled}
        loadingLabel="Signing out…"
        icon={<Icon name="arrow-right" />}
        onClick={async () => {
          setError(undefined);
          try {
            await endSession();
            window.dispatchEvent(new Event("akiba:signed-out"));
            window.location.replace("/login");
          } catch (error: unknown) {
            setError(
              error instanceof AuthRequestError
                ? error.problem.message
                : "We couldn't confirm sign-out. Please try again.",
            );
          }
        }}
      >
        {label}
      </Button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
