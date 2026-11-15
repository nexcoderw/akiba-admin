import { timingSafeEqual } from "node:crypto";

/** Server transport policy. Never import this Node-only module into browser code. */
export function csrfMatches(
  cookie: string | undefined,
  header: string | null,
): boolean {
  if (
    !cookie ||
    !header ||
    !/^[A-Za-z0-9_-]{32,256}$/u.test(cookie) ||
    !/^[A-Za-z0-9_-]{32,256}$/u.test(header)
  )
    return false;
  const left = Buffer.from(cookie);
  const right = Buffer.from(header);
  return left.length === right.length && timingSafeEqual(left, right);
}
