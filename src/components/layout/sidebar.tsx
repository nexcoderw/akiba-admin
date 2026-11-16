"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationLinks } from "@/constant/navigation-links";
import { Icon } from "@/components/shared/icon";
import styles from "./sidebar.module.css";

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={styles.sidebar}
      id="platform-sidebar"
      data-open={open || undefined}
      aria-label="Platform sidebar"
    >
      <nav aria-label="Platform navigation">
        <p className={styles.heading}>Workspace</p>
        <ul className={styles.links}>
          {navigationLinks.map(({ href, icon, label }) => {
            const active =
              href === "/"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <li key={href}>
                <Link
                  className={styles.link}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  data-active={active || undefined}
                  onNavigate={onNavigate}
                >
                  <Icon name={icon} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
