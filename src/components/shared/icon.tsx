"use client";

import {
  Alert02Icon,
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Building02Icon,
  Cancel01Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  InformationCircleIcon,
  FilterIcon,
  Link01Icon,
  LockPasswordIcon,
  Login03Icon,
  Logout01Icon,
  Mail01Icon,
  Menu01Icon,
  Search01Icon,
  TextAlignLeftIcon,
  Tick02Icon,
  UserIcon,
  UserGroupIcon,
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
  | "arrow-left"
  | "arrow-right"
  | "building"
  | "check"
  | "chevron-down"
  | "close"
  | "dashboard"
  | "email"
  | "eye"
  | "eye-off"
  | "error"
  | "info"
  | "filter"
  | "link"
  | "search"
  | "list"
  | "login"
  | "lock"
  | "logout"
  | "text"
  | "user"
  | "users"
  | "credit-card"
  | "audit"
  | "security"
  | "key"
  | "warning";

const icons: Record<IconName, IconSvgElement> = {
  "arrow-left": ArrowLeft01Icon,
  "arrow-right": ArrowRight01Icon,
  building: Building02Icon,
  check: Tick02Icon,
  "chevron-down": ArrowDown01Icon,
  close: Cancel01Icon,
  dashboard: DashboardSquare01Icon,
  email: Mail01Icon,
  eye: ViewIcon,
  "eye-off": ViewOffSlashIcon,
  error: AlertCircleIcon,
  info: InformationCircleIcon,
  filter: FilterIcon,
  link: Link01Icon,
  search: Search01Icon,
  list: Menu01Icon,
  login: Login03Icon,
  lock: LockPasswordIcon,
  logout: Logout01Icon,
  text: TextAlignLeftIcon,
  user: UserIcon,
  users: UserGroupIcon,
  "credit-card": CreditCardIcon,
  audit: InformationCircleIcon,
  security: LockPasswordIcon,
  key: LockPasswordIcon,
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
