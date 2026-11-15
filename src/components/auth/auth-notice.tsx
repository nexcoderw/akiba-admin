"use client";

import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import styles from "./auth-notice.module.css";

export function AuthNotice({
  checking = false,
  title = "We couldn't verify your session",
  message = "The service is temporarily unavailable. Check your connection and try again.",
  requestId,
  onRetryAction,
}: {
  checking?: boolean;
  title?: string;
  message?: string;
  requestId?: string;
  onRetryAction?: () => void | Promise<void>;
}) {
  return (
    <section
      className={styles.notice}
      aria-busy={checking}
      aria-labelledby="session-notice-title"
    >
      <span className={styles.icon}>
        <Icon name={checking ? "lock" : "warning"} />
      </span>
      <h1 id="session-notice-title">
        {checking ? "Checking your session" : title}
      </h1>
      <p role="status">
        {checking ? "Please wait while we verify your access." : message}
      </p>
      {!checking && (
        <Button
          variant="secondary"
          onClick={onRetryAction ?? (() => window.location.reload())}
        >
          Try again
        </Button>
      )}
      {requestId && <small>Reference: {requestId}</small>}
    </section>
  );
}
