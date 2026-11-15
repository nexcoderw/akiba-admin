import { Icon } from "@/components/shared/icon";
import styles from "./loading-state.module.css";

export function LoadingState({
  title = "Checking your session",
  message = "We’re securely confirming your platform access before opening your workspace.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <section
      className={styles.screen}
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
