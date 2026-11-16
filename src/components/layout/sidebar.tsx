"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
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
  const trackRef = useRef<HTMLDivElement>(null);

  // Slides one shared highlight to the active link. Positions go straight to CSS
  // variables on the track, so there is no extra render and no layout flash.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function place() {
      const active = track?.querySelector<HTMLElement>("[data-active]");
      if (!track) return;
      if (!active) {
        track.removeAttribute("data-has-active");
        return;
      }
      track.style.setProperty("--indicator-y", `${active.offsetTop}px`);
      track.style.setProperty("--indicator-h", `${active.offsetHeight}px`);
      track.setAttribute("data-has-active", "");
    }

    place();
    // Enable the slide transition only after the first placement, so it doesn't animate in from 0.
    const frame = requestAnimationFrame(() =>
      track.setAttribute("data-ready", ""),
    );
    const observer = new ResizeObserver(place);
    observer.observe(track);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <aside
      className={styles.sidebar}
      id="platform-sidebar"
      data-open={open || undefined}
      aria-label="Platform sidebar"
    >
      <nav aria-label="Platform navigation">
        <p className={styles.heading}>Workspace</p>
        <div className={styles.track} ref={trackRef}>
          <span className={styles.indicator} aria-hidden="true" />
          <ul className={styles.links}>
            {navigationLinks.map(({ href, icon, label }, index) => {
              const active =
                href === "/"
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);

              return (
                <li
                  key={href}
                  className={styles.item}
                  style={{ "--i": index } as CSSProperties}
                >
                  <Link
                    className={styles.link}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    data-active={active || undefined}
                    onNavigate={onNavigate}
                  >
                    <span className={styles.icon} aria-hidden="true">
                      <Icon name={icon} />
                    </span>
                    <span className={styles.label}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}