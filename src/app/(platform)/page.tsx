import { Suspense } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth/session.server";
import { LogoutButton } from "@/components/auth/logout-button";
import { AuthNotice } from "@/components/auth/auth-notice";
import { Icon } from "@/components/shared/icon";
import styles from "./page.module.css";

async function AccountLanding() {
  const result = await getSession();
  if (result.kind !== "authenticated") return null;
  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <Link
          href="/"
          prefetch={false}
          className={styles.brand}
          aria-label="Akiba workspace"
        >
          akiba.
        </Link>
        <LogoutButton />
      </header>
      <section className={styles.welcome}>
        <div className={styles.status}>
          <Icon name="check" /> Verified platform session
        </div>
        <h1>Welcome back, {result.session.displayName}.</h1>
        <p>You&apos;re signed in to Akiba Platform Administration.</p>
        <p className={styles.account}>{result.session.email}</p>
        <div className={styles.note}>
          <Icon name="lock" />
          <p>
            Your access is verified by the platform. Administrative features
            will appear here as they become available.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<AuthNotice checking />}>
      <AccountLanding />
    </Suspense>
  );
}
