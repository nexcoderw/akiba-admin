import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/shared/icon";
import styles from "./auth-screen.module.css";

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <main className={styles.screen}>
      <section
        className={styles.story}
        aria-label="Akiba platform administration"
      >
        <Link
          className={styles.brand}
          href="/login"
          prefetch={false}
          aria-label="Akiba sign in"
        >
          <span className={styles.mark} aria-hidden="true">
            a
          </span>
          <span>
            akiba<span className={styles.brandDot}>.</span>
          </span>
        </Link>
        <div className={styles.storyCopy}>
          <p className={styles.eyebrow}>PLATFORM ADMINISTRATION</p>
          <p className={styles.storyTitle}>
            A clear view.
            <br />A secure foundation.
          </p>
          <p>
            Your workspace for administering Akiba, with an extra layer of
            protection at every sign-in.
          </p>
        </div>
        <div className={styles.assurance}>
          <Icon name="lock" /> Access is reserved for authorized platform
          administrators.
        </div>
      </section>
      <section className={styles.content} aria-label="Secure account access">
        <div className={styles.card}>{children}</div>
        <p className={styles.footer}>
          <Icon name="lock" /> Protected access · Akiba Platform
        </p>
      </section>
    </main>
  );
}
