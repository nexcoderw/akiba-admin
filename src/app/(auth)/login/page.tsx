import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthNotice } from "@/components/auth/auth-notice";
import { LoginForm } from "@/components/auth/login-form";
import { getSession, hasPendingChallenge } from "@/lib/auth/session.server";
import { safeDestination } from "@/lib/auth/contracts";

export const metadata = {
  title: "Sign in · Akiba",
  robots: { index: false, follow: false },
};

async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const result = await getSession();
  if (result.kind === "authenticated") redirect(safeDestination(query.next));
  if (result.kind === "unavailable" || result.kind === "denied") {
    return (
      <AuthNotice
        title={result.kind === "denied" ? "Access unavailable" : undefined}
        message={result.problem.message}
        requestId={result.problem.requestId}
      />
    );
  }
  return (
    <LoginForm
      pendingOnLoad={await hasPendingChallenge()}
      expiredSession={query.expired === "1"}
      next={safeDestination(query.next)}
    />
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<AuthNotice checking />}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}
