import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./auth-screen.module.css";

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <main className={styles.screen}>
      <div className={styles.shell}>
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
        <section className={styles.card} aria-label="Secure account access">
          {children}
        </section>
      </div>
    </main>
  );
}
