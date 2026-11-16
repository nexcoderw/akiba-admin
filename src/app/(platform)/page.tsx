import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthNotice } from "@/components/auth/auth-notice";
import { AuthScreen } from "@/components/auth/auth-screen";
import { getSession } from "@/lib/auth/session.server";
import { Icon } from "@/components/shared/icon";
import { LoadingState } from "@/components/shared/loading-state";
import styles from "./page.module.css";

async function AccountLanding() {
  const result = await getSession();
  if (result.kind === "unauthenticated") redirect("/login?expired=1&next=%2F");
  if (result.kind === "denied" || result.kind === "unavailable") {
    return (
      <AuthScreen>
        <AuthNotice
          title={result.kind === "denied" ? "Access unavailable" : undefined}
          message={result.problem.message}
          requestId={result.problem.requestId}
        />
      </AuthScreen>
    );
  }
  return (
    <section className={styles.workspace} aria-labelledby="dashboard-title">
      <section className={styles.welcome}>
        <div className={styles.status}>
          <Icon name="check" /> Verified platform session
        </div>
        <h1 id="dashboard-title">
          Welcome back, {result.session.displayName}.
        </h1>
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
    </section>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingState phase="workspace" />}>
      <AccountLanding />
    </Suspense>
  );
}
