import { Icon } from "@/components/shared/icon";
import styles from "./loading-state.module.css";

export type LoadingStatePhase =
  "session-check" | "mfa-verification" | "workspace" | "session-expired";

const copy: Record<LoadingStatePhase, { title: string; message: string }> = {
  "session-check": {
    title: "Checking your session",
    message:
      "We’re securely confirming your platform access before opening your workspace.",
  },
  "mfa-verification": {
    title: "Verifying your sign-in",
    message:
      "We’re checking your code and confirming your secure platform session.",
  },
  workspace: {
    title: "Loading your workspace",
    message:
      "Your session is confirmed. We’re preparing the platform page for you.",
  },
  "session-expired": {
    title: "Returning to sign in",
    message:
      "Your session is no longer active. We’re taking you back to sign in.",
  },
};

export function LoadingState({
  phase = "session-check",
  variant = "page",
}: {
  phase?: LoadingStatePhase;
  variant?: "page" | "inline";
}) {
  const { title, message } = copy[phase];

  return (
    <section
      className={styles.screen}
      data-variant={variant}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            a
          </span>
          <span>
            akiba<span className={styles.brandDot}>.</span>
          </span>
        </div>

        <div className={styles.loader} aria-hidden="true">
          <span className={styles.loaderTrack} />
          <span className={styles.lock}>
            <Icon name="lock" />
          </span>
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>Secure platform access</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.progress} aria-hidden="true">
          <span />
        </div>
        <p className={styles.footnote}>
          <span className={styles.pulse} aria-hidden="true" />
          Your workspace will appear when this is complete.
        </p>
      </div>
    </section>
  );
}
