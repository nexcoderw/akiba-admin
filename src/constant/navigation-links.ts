import type { IconName } from "@/components/shared/icon";

export const navigationLinks = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Organizations", href: "/organizations", icon: "building" },
  { label: "Users", href: "/users", icon: "users" },
] as const satisfies readonly {
  label: string;
  href: string;
  icon: IconName;
}[];
