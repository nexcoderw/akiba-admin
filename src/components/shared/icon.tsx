"use client";

import {
  Alert02Icon,
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  InformationCircleIcon,
  LockPasswordIcon,
  Login03Icon,
  Mail01Icon,
  Menu01Icon,
  TextAlignLeftIcon,
  Tick02Icon,
  UserIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import {
  HugeiconsIcon,
  type HugeiconsIconProps,
  type IconSvgElement,
} from "@hugeicons/react";
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
  | "login"
  | "lock"
  | "text"
  | "user"
  | "warning";

const icons: Record<IconName, IconSvgElement> = {
  "arrow-right": ArrowRight01Icon,
  check: Tick02Icon,
  "chevron-down": ArrowDown01Icon,
  close: Cancel01Icon,
  email: Mail01Icon,
  eye: ViewIcon,
  "eye-off": ViewOffSlashIcon,
  error: AlertCircleIcon,
  info: InformationCircleIcon,
  list: Menu01Icon,
  login: Login03Icon,
  lock: LockPasswordIcon,
  text: TextAlignLeftIcon,
  user: UserIcon,
  warning: Alert02Icon,
};

/** Decorative by default; put an accessible name on the enclosing control. */
export function Icon({
  name,
  className = "",
  ...props
}: Omit<
  HugeiconsIconProps,
  "icon" | "altIcon" | "showAlt" | "children" | "name"
> & {
  name: IconName;
}) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={20}
      strokeWidth={1.7}
      aria-hidden="true"
      focusable="false"
      {...props}
      className={`${styles.icon} ${className}`}
    />
  );
}
