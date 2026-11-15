import { OwnerEnrollment } from "@/components/auth/owner-enrollment";

export const metadata = {
  title: "Set up platform owner · Akiba",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PlatformOwnerEnrollmentPage() {
  return <OwnerEnrollment />;
}
