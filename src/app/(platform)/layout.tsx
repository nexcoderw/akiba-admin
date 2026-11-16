import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session.server";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthNotice } from "@/components/auth/auth-notice";
import { SessionProvider } from "@/components/auth/session-provider";
import { PlatformLayout as PlatformShell } from "@/components/layout/platform-layout";
import { LoadingState } from "@/components/shared/loading-state";

async function PlatformAccess({ children }: { children: ReactNode }) {
  const result = await getSession();
  if (result.kind === "unauthenticated") redirect("/login?next=%2F");
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
    <SessionProvider initialSession={result.session}>
      <PlatformShell>{children}</PlatformShell>
    </SessionProvider>
  );
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState phase="session-check" />}>
      <PlatformAccess>{children}</PlatformAccess>
    </Suspense>
  );
}
