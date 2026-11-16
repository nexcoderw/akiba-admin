"use client";

import Link from "next/link";
import type { Ref } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icon";
import styles from "./navbar.module.css";

function initials(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

export function Navbar({
  displayName,
  email,
  navigationOpen,
  menuButtonRef,
  onToggleNavigation,
}: {
  displayName: string;
  email: string;
  navigationOpen: boolean;
  menuButtonRef: Ref<HTMLButtonElement>;
  onToggleNavigation: () => void;
}) {
  return (
    <header className={styles.navbar}>
      <div className={styles.identity}>
        <Button
          ref={menuButtonRef}
          className={styles.menuButton}
          variant="ghost"
          size="sm"
          icon={<Icon name={navigationOpen ? "close" : "list"} />}
          aria-label={
            navigationOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={navigationOpen}
          aria-controls="platform-sidebar"
          onClick={onToggleNavigation}
        />
        <Link className={styles.brand} href="/" aria-label="Akiba dashboard">
          akiba<span>.</span>
        </Link>
      </div>

      <div className={styles.account}>
        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">
            {initials(displayName)}
          </span>
          <span className={styles.userCopy}>
            <span className={styles.displayName} title={displayName}>
              {displayName}
            </span>
            <span className={styles.email}>{email}</span>
          </span>
        </div>
        <LogoutButton
          label="Sign out"
          icon={<Icon name="logout" />}
          size="sm"
        />
      </div>
    </header>
  );
}
