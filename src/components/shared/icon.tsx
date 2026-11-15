import type { SVGProps } from "react";
import styles from "./icon.module.css";

export type IconName =
  | "arrow-right"
  | "check"
  | "chevron-down"
  | "close"
  | "email"
  | "eye"
  | "eye-off"
  | "error"
  | "info"
  | "list"
  | "lock"
  | "text"
  | "user"
  | "warning";

const paths: Record<IconName, string> = {
  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  "chevron-down": "m6 9 6 6 6-6",
  close: "m6 6 12 12M6 18 18 6",
  email: "M4 5h16v14H4z m0 1 8 7 8-7",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12m13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  "eye-off":
    "m3 3 18 18M10 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3 3.7M6.2 6.2A20 20 0 0 0 2 12s3.5 7 10 7a12 12 0 0 0 5.8-1.5M10 10a3 3 0 0 0 4 4",
  error: "M12 8v5m0 3h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  info: "M12 11v6m0-10h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  lock: "M5 10h14v11H5z M8 10V7a4 4 0 0 1 8 0v3m-4 5v2",
  text: "M4 6h16M4 12h16M4 18h10",
  user: "M20 21v-2a7 7 0 0 0-14 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  warning: "m12 3 10 18H2L12 3zm0 5v5m0 4h.01",
};

/** Decorative by default; put an accessible name on the enclosing control. */
export function Icon({
  name,
  className = "",
  ...props
}: Omit<SVGProps<SVGSVGElement>, "children" | "name"> & { name: IconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
      className={`${styles.icon} ${className}`}
    >
      <path d={paths[name]} />
    </svg>
  );
}
