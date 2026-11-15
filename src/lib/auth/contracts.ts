export type MfaMethod = "totp" | "recovery_code" | "email_otp";

export interface PlatformSession {
  displayName: string;
  email: string;
  expiresAt: string;
  permissions: string[];
}

export interface Challenge {
  status: "MFA_REQUIRED";
  nextStep: "VERIFY_MFA";
  expiresAt: string;
  methods: MfaMethod[];
}

export interface Verification {
  status: "authenticated" | "mfa_recovery_required";
  expiresAt: string;
}

export interface SafeProblem {
  status: number;
  code: string;
  message: string;
  requestId?: string;
}

export type SessionResult =
  | { kind: "authenticated"; session: PlatformSession }
  | { kind: "unauthenticated" }
  | { kind: "denied"; problem: SafeProblem }
  | { kind: "unavailable"; problem: SafeProblem };

export const AUTH_PATHS = {
  login: "/api/v1/platform/auth/login",
  verify: "/api/v1/platform/auth/mfa/verify",
  session: "/api/v1/platform/auth/me",
  logout: "/api/v1/platform/auth/logout",
} as const;

export type AuthOperation = keyof typeof AUTH_PATHS;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shortText(value: unknown, limit: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= limit;
}

function validExpiry(value: unknown): value is string {
  return shortText(value, 40) && Number.isFinite(Date.parse(value));
}

function strings(value: unknown, limit: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= limit &&
    value.every((item) => shortText(item, 150))
  );
}

export function parseSession(value: unknown): PlatformSession | null {
  if (
    !isRecord(value) ||
    value.authenticated !== true ||
    value.mfaVerified !== true ||
    !shortText(value.userId, 100) ||
    !shortText(value.platformStaffId, 100) ||
    !shortText(value.displayName, 200) ||
    !shortText(value.email, 254) ||
    !validExpiry(value.expiresAt) ||
    !strings(value.permissions, 500)
  )
    return null;
  return {
    displayName: value.displayName,
    email: value.email,
    expiresAt: value.expiresAt,
    permissions: value.permissions,
  };
}

export function parsePublicSession(value: unknown): PlatformSession | null {
  if (
    !isRecord(value) ||
    !shortText(value.displayName, 200) ||
    !shortText(value.email, 254) ||
    !validExpiry(value.expiresAt) ||
    !strings(value.permissions, 500)
  )
    return null;
  return {
    displayName: value.displayName,
    email: value.email,
    expiresAt: value.expiresAt,
    permissions: value.permissions,
  };
}

export function parseChallenge(value: unknown): Challenge | null {
  if (
    !isRecord(value) ||
    value.status !== "MFA_REQUIRED" ||
    value.nextStep !== "VERIFY_MFA" ||
    !validExpiry(value.expiresAt) ||
    !Array.isArray(value.methods) ||
    value.methods.length === 0 ||
    value.methods.length > 3 ||
    !value.methods.every(
      (item): item is MfaMethod =>
        item === "totp" || item === "recovery_code" || item === "email_otp",
    )
  )
    return null;
  return {
    status: value.status,
    nextStep: value.nextStep,
    expiresAt: value.expiresAt,
    methods: [...value.methods],
  };
}

export function parseVerification(value: unknown): Verification | null {
  if (
    !isRecord(value) ||
    (value.status !== "authenticated" &&
      value.status !== "mfa_recovery_required") ||
    !validExpiry(value.expiresAt)
  )
    return null;
  return { status: value.status, expiresAt: value.expiresAt };
}

/** Only the existing account landing route is eligible; expand with verified route permissions. */
export function safeDestination(value: unknown): string {
  return value === "/" ? value : "/";
}

export function loginErrors(
  email: string,
  password: string,
): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email.trim())
  )
    errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  else if (
    password.length > 4096 ||
    new TextEncoder().encode(password).length > 4096 ||
    /\p{Cs}/u.test(password)
  ) {
    errors.password = "This password exceeds the supported sign-in limits.";
  }
  return errors;
}

export function validLoginBody(
  value: unknown,
): value is { email: string; password: string } {
  return (
    isRecord(value) &&
    Object.keys(value).length === 2 &&
    typeof value.email === "string" &&
    typeof value.password === "string" &&
    Object.keys(loginErrors(value.email, value.password)).length === 0
  );
}

export function validVerificationBody(
  value: unknown,
): value is
  | { method: "totp"; totpCode: string }
  | { method: "recovery_code"; recoveryCode: string } {
  if (!isRecord(value) || Object.keys(value).length !== 2) return false;
  if (value.method === "totp")
    return (
      typeof value.totpCode === "string" && /^\d{6}$/u.test(value.totpCode)
    );
  return (
    value.method === "recovery_code" &&
    typeof value.recoveryCode === "string" &&
    value.recoveryCode.length <= 64 &&
    /^(?:[A-Fa-f0-9]{4}-){7}[A-Fa-f0-9]{4}$/u.test(value.recoveryCode)
  );
}

export function safeProblem(
  status: number,
  body: unknown,
  operation: AuthOperation,
): SafeProblem {
  const source = isRecord(body) ? body : {};
  const allowedCodes = new Set([
    "VALIDATION_FAILED",
    "BAD_REQUEST",
    "ACCESS_DENIED",
    "UNAUTHENTICATED",
    "RATE_LIMITED",
    "AUTH_INVALID_CREDENTIALS",
    "AUTH_SESSION_EXPIRED",
    "AUTH_MFA_REQUIRED",
    "AUTH_MFA_INVALID",
    "SERVICE_UNAVAILABLE",
    "INTERNAL_ERROR",
    "BAD_GATEWAY",
    "GATEWAY_TIMEOUT",
    "NETWORK_UNAVAILABLE",
    "PLATFORM_AUTHENTICATION_FAILED",
    "PLATFORM_SESSION_INVALID",
    "PLATFORM_MFA_VERIFICATION_FAILED",
    "PLATFORM_MFA_SETUP_REQUIRED",
    "PLATFORM_ORIGIN_REJECTED",
    "PLATFORM_CSRF_REJECTED",
    "PLATFORM_PERMISSION_DENIED",
    "PLATFORM_PERMISSION_REQUIRED",
    "PLATFORM_LOGIN_RATE_LIMITED",
    "PLATFORM_SESSION_UNAVAILABLE",
    "PLATFORM_LOGIN_UNAVAILABLE",
    "PLATFORM_MFA_UNAVAILABLE",
  ]);
  const code =
    typeof source.code === "string" && allowedCodes.has(source.code)
      ? source.code
      : status === 401
        ? "UNAUTHENTICATED"
        : status === 403
          ? "ACCESS_DENIED"
          : status === 429
            ? "RATE_LIMITED"
            : status === 400
              ? "VALIDATION_FAILED"
              : "SERVICE_UNAVAILABLE";
  const requestId =
    typeof source.requestId === "string" &&
    /^[a-zA-Z0-9_-]{1,80}$/u.test(source.requestId)
      ? source.requestId
      : undefined;
  let message = "The service is temporarily unavailable. Please try again.";
  if (status === 400 || status === 422)
    message = "Check your information and try again.";
  if (status === 401)
    message =
      operation === "login"
        ? "Unable to sign in with the provided credentials."
        : operation === "verify"
          ? "The code or sign-in request is invalid or has expired. Try a current code or start again."
          : "Your session has expired. Sign in again.";
  if (status === 403)
    message = "You don't have permission to perform this action.";
  if (status === 412)
    message = "Complete the required security verification before continuing.";
  if (status === 429)
    message = "Too many attempts. Please wait before trying again.";
  return { status, code, message, ...(requestId ? { requestId } : {}) };
}

export function sessionResult(status: number, body: unknown): SessionResult {
  if (status === 401) return { kind: "unauthenticated" };
  if (status === 403)
    return { kind: "denied", problem: safeProblem(status, body, "session") };
  const session = status === 200 ? parsePublicSession(body) : null;
  if (session)
    return Date.parse(session.expiresAt) > Date.now()
      ? { kind: "authenticated", session }
      : { kind: "unauthenticated" };
  return {
    kind: "unavailable",
    problem: safeProblem(status === 200 ? 502 : status, body, "session"),
  };
}
