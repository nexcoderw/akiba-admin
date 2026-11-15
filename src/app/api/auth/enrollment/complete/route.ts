import { handle } from "@/lib/auth/bff.server";

export function POST(request: Request) {
  return handle("enrollmentComplete", request);
}
