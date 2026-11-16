"use client";

import { usePathname } from "next/navigation";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { usePlatformSession } from "@/components/auth/session-provider";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import styles from "./platform-layout.module.css";

export function PlatformLayout({ children }: { children: ReactNode }) {
  const session = usePlatformSession();
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigationOpen = openPath === pathname;

  function closeNavigation(restoreFocus = false) {
    setOpenPath(null);
    if (restoreFocus) {
      requestAnimationFrame(() => menuButton.current?.focus());
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && navigationOpen) {
      event.preventDefault();
      closeNavigation(true);
    }
  }

  return (
    <div className={styles.shell} onKeyDown={handleKeyDown}>
      <Navbar
        displayName={session.displayName}
        email={session.email}
        navigationOpen={navigationOpen}
        menuButtonRef={menuButton}
        onToggleNavigation={() => setOpenPath(navigationOpen ? null : pathname)}
      />
      <div className={styles.body}>
        {navigationOpen && (
          <button
            className={styles.backdrop}
            type="button"
            aria-label="Close navigation menu"
            onClick={() => closeNavigation(true)}
          />
        )}
        <Sidebar
          open={navigationOpen}
          onNavigate={() => {
            closeNavigation();
            requestAnimationFrame(() =>
              document.getElementById("platform-main")?.focus(),
            );
          }}
        />
        <main className={styles.content} id="platform-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
