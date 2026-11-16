import type { IconName } from "@/components/shared/icon";

export const navigationLinks = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Organizations", href: "/organizations", icon: "building" },
      { label: "Owner invitations", href: "/owner-invitations", icon: "email" },
  { label: "Roles & permissions", href: "/roles", icon: "key" },
  { label: "Users", href: "/users", icon: "users" },
  { label: "Subscriptions", href: "/subscriptions", icon: "credit-card" },
  { label: "Audit logs", href: "/audit-logs", icon: "audit" },
  { label: "Security & MFA", href: "/security", icon: "security" },
] as const satisfies readonly {
  label: string;
  href: string;
  icon: IconName;
}[];
