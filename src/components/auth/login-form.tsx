"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/button";
import { Form } from "@/components/shared/form";
import { Icon } from "@/components/shared/icon";
import { Input } from "@/components/shared/input";
import { OtpInput } from "@/components/shared/otp-input";
import { useToast } from "@/components/shared/toast";
import { LoadingState } from "@/components/shared/loading-state";
import {
  AuthRequestError,
  readSession,
  requestEmailCode,
  startLogin,
  verifyMfa,
} from "@/lib/auth/browser";
import {
  loginErrors,
  safeDestination,
  validVerificationBody,
  verificationBody,
  type Challenge,
  type EmailCodeDelivery,
  type MfaMethod,
} from "@/lib/auth/contracts";
import { LogoutButton } from "./logout-button";
import styles from "./login-form.module.css";

type Step = { kind: "password" } | { kind: "otp"; challenge: Challenge | null };

type VerificationState =
  | "input"
  | "verifying"
  | "checking-session"
  | "retry"
  | "recovery-required"
  | "email-verified";

const methodOptions = [
  ["totp", "Use my authenticator"],
  ["email_otp", "Use an email code"],
  ["recovery_code", "Use a recovery code"],
] as const;

const methodInstructions: Record<MfaMethod, string> = {
  totp: "Enter the six-digit code from your authenticator app.",
  recovery_code: "Enter one of your unused recovery codes.",
  email_otp:
    "Verify the email address on your account. Workspace access requires your authenticator app.",
};

export function LoginForm({
  pendingOnLoad,
  expiredSession,
  next,
}: {
  pendingOnLoad: boolean;
  expiredSession: boolean;
  next: string;
}) {
  const [step, setStep] = useState<Step>(
    pendingOnLoad ? { kind: "otp", challenge: null } : { kind: "password" },
  );
  const [verificationState, setVerificationState] =
    useState<VerificationState>("input");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<MfaMethod>("totp");
  const [emailDelivery, setEmailDelivery] =
    useState<EmailCodeDelivery | null>(null);
  const [emailExpired, setEmailExpired] = useState(false);
  const [resendReady, setResendReady] = useState(false);
  const [fields, setFields] = useState<{
    email?: string;
    password?: string;
    code?: string;
  }>({});
  const toast = useToast();
  const errorToastId = useRef<number | undefined>(undefined);
  const expirationNoticeShown = useRef(false);
  const [challengeExpired, setChallengeExpired] = useState(false);
  const [otp, setOtp] = useState("");
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const code = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (
      !expiredSession ||
      step.kind !== "password" ||
      expirationNoticeShown.current
    ) {
      return;
    }
    expirationNoticeShown.current = true;
    toast.info("Your session ended. Sign in again to continue.");
  }, [expiredSession, step.kind, toast]);

  useEffect(() => {
    if (step.kind === "otp") heading.current?.focus();
  }, [step.kind, method, verificationState]);

  useEffect(() => {
    if (step.kind !== "otp" || !step.challenge) return;
    const timer = window.setTimeout(
      () => setChallengeExpired(true),
      Math.max(
        0,
        Math.min(Date.parse(step.challenge.expiresAt) - Date.now(), 2147483647),
      ),
    );
    return () => {
      window.clearTimeout(timer);
    };
  }, [step]);

  useEffect(() => {
    if (!emailDelivery) return;
    const expiry = window.setTimeout(
      () => setEmailExpired(true),
      Math.max(
        0,
        Math.min(Date.parse(emailDelivery.expiresAt) - Date.now(), 2147483647),
      ),
    );
    const cooldown = window.setTimeout(
      () => setResendReady(true),
      emailDelivery.retryAfterSeconds * 1000,
    );
    return () => {
      window.clearTimeout(expiry);
      window.clearTimeout(cooldown);
    };
  }, [emailDelivery]);

  function clearErrorToast() {
    if (errorToastId.current === undefined) return;
    toast.dismiss(errorToastId.current);
    errorToastId.current = undefined;
  }

  function showError(message: string) {
    clearErrorToast();
    errorToastId.current = toast.error(message);
  }

  function showRequestError(error: unknown) {
    showError(
      error instanceof AuthRequestError
        ? error.problem.message
        : "The service is temporarily unavailable. Please try again.",
    );
  }

  function changeMethod(nextMethod: MfaMethod) {
    if (busy) return;
    if (code.current) code.current.value = "";
    setOtp("");
    setFields({});
    clearErrorToast();
    setMethod(nextMethod);
  }

  async function sendEmailCode() {
    if (busy || challengeExpired || (emailDelivery && !resendReady)) return;
    clearErrorToast();
    setBusy(true);
    try {
      const delivery = await requestEmailCode();
      setOtp("");
      setFields({});
      setEmailExpired(false);
      setResendReady(false);
      setEmailDelivery(delivery);
      requestAnimationFrame(() => code.current?.focus());
    } catch (error: unknown) {
      if (
        error instanceof AuthRequestError &&
        (error.problem.status === 0 || error.problem.status >= 500)
      ) {
        setEmailDelivery(null);
        setOtp("");
        setFields({});
      }
      showRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  async function confirmSession() {
    clearErrorToast();
    setVerificationState("checking-session");
    const result = await readSession();
    if (result.kind === "authenticated") {
      window.location.replace(safeDestination(next));
      return;
    } else if (result.kind === "denied" || result.kind === "unavailable") {
      showError(result.problem.message);
    } else {
      showError(
        "Your session couldn't be confirmed. Start again or retry the session check.",
      );
    }
    setVerificationState("retry");
  }

  async function retrySessionCheck() {
    if (busy) return;
    setBusy(true);
    try {
      await confirmSession();
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    if (busy) return;
    if (code.current) code.current.value = "";
    clearErrorToast();
    setOtp("");
    setFields({});
    setVisible(false);
    setChallengeExpired(false);
    setMethod("totp");
    setEmailDelivery(null);
    setVerificationState("input");
    setStep({ kind: "password" });
  }

  const title =
    step.kind === "password"
      ? "Welcome back"
      : verificationState === "email-verified"
        ? "Email verified"
        : "Verify your sign-in";
  const methods =
    step.kind === "otp" ? (step.challenge?.methods ?? ["totp"]) : [];
  const canVerify = methods.includes(method);
  const emailInputDisabled =
    method === "email_otp" && (!emailDelivery || emailExpired);

  if (
    verificationState === "verifying" ||
    verificationState === "checking-session"
  ) {
    return (
      <LoadingState
        phase={
          verificationState === "verifying"
            ? "mfa-verification"
            : "session-check"
        }
      />
    );
  }

  return (
    <div className={styles.login}>
      <header className={styles.header}>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        {verificationState !== "email-verified" && (
          <p>
            {step.kind === "password"
              ? "Sign in to your Akiba administration workspace."
              : verificationState === "recovery-required"
                ? "Your recovery proof was accepted, but authenticator recovery must be completed before you can continue."
                : verificationState === "retry"
                  ? "We couldn't confirm the result of your verification."
                  : methodInstructions[method]}
          </p>
        )}
        {step.kind === "otp" &&
          step.challenge === null &&
          verificationState === "input" && (
            <p>Start sign-in again to see your other verification options.</p>
          )}
      </header>
      {step.kind === "password" && (
        <Form
          className={styles.form}
          noValidate
          onSubmitAction={async (data) => {
            clearErrorToast();
            const emailValue =
              typeof data.get("email") === "string"
                ? String(data.get("email"))
                : "";
            const passwordValue =
              typeof data.get("password") === "string"
                ? String(data.get("password"))
                : "";
            const errors = loginErrors(emailValue, passwordValue);
            setFields(errors);
            if (errors.email || errors.password) {
              toast.warning("Please check the highlighted fields.");
              (errors.email ? email.current : password.current)?.focus();
              return;
            }
            setBusy(true);
            try {
              const challenge = await startLogin(
                emailValue.trim(),
                passwordValue,
              );
              if (password.current) password.current.value = "";
              setVisible(false);
              setChallengeExpired(false);
              const preferredMethod = challenge.methods.includes("totp")
                ? "totp"
                : "recovery_code";
              setMethod(
                challenge.methods.includes(preferredMethod)
                  ? preferredMethod
                  : "email_otp",
              );
              setVerificationState("input");
              setStep({ kind: "otp", challenge });
            } catch (error: unknown) {
              showRequestError(error);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            ref={email}
            id="login-email"
            name="email"
            type="email"
            label="Email address"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={254}
            placeholder="you@company.com"
            error={fields.email}
          />
          <Input
            ref={password}
            id="login-password"
            name="password"
            type={visible ? "text" : "password"}
            label="Password"
            autoComplete="current-password"
            required
            maxLength={4096}
            placeholder="Enter your password"
            icon={<Icon name="lock" />}
            error={fields.password}
            trailingAction={
              <button
                type="button"
                className={styles.visibility}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                aria-controls="login-password"
                onClick={() => setVisible((current) => !current)}
              >
                <Icon name={visible ? "eye-off" : "eye"} />
              </button>
            }
          />
          <Button
            type="submit"
            fullWidth
            icon={<Icon name="login" />}
            loadingLabel="Signing in…"
          >
            Sign in
          </Button>
        </Form>
      )}
      {step.kind === "otp" &&
        (verificationState === "email-verified" ? (
          <div className={styles.followUp}>
            <p>
              Sign in again with your authenticator app to open the workspace.
              If you lost access to your app, use a saved recovery code or
              contact your platform administrator.
            </p>
            <LogoutButton label="Return to sign in" fullWidth />
          </div>
        ) : verificationState === "recovery-required" ? (
          <div className={styles.followUp}>
            <p>
              Authenticator repair is not available in this frontend milestone.
              Contact your approved platform recovery administrator. This
              recovery session cannot open the platform workspace.
            </p>
            <LogoutButton label="End recovery session" />
          </div>
        ) : verificationState === "retry" ? (
          <div className={styles.followUp}>
            {method === "email_otp" ? (
              <p>Cancel this sign-in and start again to verify your email.</p>
            ) : (
              <>
                <p>Check your session before submitting another code.</p>
                <Button
                  fullWidth
                  pending={busy}
                  onClick={retrySessionCheck}
                  icon={<Icon name="check" />}
                >
                  Check session
                </Button>
              </>
            )}
            <LogoutButton
              label="Cancel sign in"
              disabled={busy}
              fullWidth
              icon={<Icon name="close" />}
            />
          </div>
        ) : canVerify ? (
          <>
            {challengeExpired && (
              <p className={styles.problem} role="alert">
                This sign-in request has expired. Start again to continue.
              </p>
            )}
            {method === "email_otp" && !challengeExpired && (
              <div className={styles.emailDelivery}>
                {emailDelivery && (
                  <p role="status">
                    {emailExpired
                      ? "This email code has expired. Request a new code to continue."
                      : "We sent a code to your verified email address. Use the newest code in your inbox."}
                    {!resendReady &&
                      ` You can request another code after ${emailDelivery.retryAfterSeconds} seconds.`}
                  </p>
                )}
                <Button
                  variant={emailDelivery ? "secondary" : "primary"}
                  fullWidth
                  disabled={busy || (emailDelivery !== null && !resendReady)}
                  loadingLabel="Sending code…"
                  onClick={sendEmailCode}
                >
                  {emailDelivery ? "Resend email code" : "Send email code"}
                </Button>
              </div>
            )}
            {(method !== "email_otp" || emailDelivery) && (
              <Form
                className={styles.form}
                noValidate
                onSubmitAction={async (data) => {
                  if (busy || challengeExpired || emailInputDisabled) return;
                  clearErrorToast();
                  const raw = data.get("code");
                  const value = typeof raw === "string" ? raw.trim() : "";
                  const body = verificationBody(method, value);
                  if (!validVerificationBody(body)) {
                    setFields({
                      code:
                        method === "recovery_code"
                          ? "Enter a valid recovery code, including its hyphens."
                          : "Enter a six-digit verification code.",
                    });
                    code.current?.focus();
                    return;
                  }
                  setFields({});
                  setBusy(true);
                  if (code.current) code.current.value = "";
                  setOtp("");
                  setVerificationState("verifying");
                  try {
                    const verified = await verifyMfa(method, value);
                    if (verified.status === "email_verified") {
                      setEmailDelivery(null);
                      setVerificationState("email-verified");
                      return;
                    }
                    if (verified.status === "mfa_recovery_required") {
                      setVerificationState("recovery-required");
                      return;
                    }
                    await confirmSession();
                  } catch (error: unknown) {
                    if (
                      error instanceof AuthRequestError &&
                      (error.problem.status === 0 || error.problem.status >= 500)
                    ) {
                      if (code.current) code.current.value = "";
                      setVerificationState("retry");
                      showError(
                        method === "email_otp"
                          ? "We couldn't confirm email verification."
                          : "We couldn't confirm verification. Check your session before submitting another code.",
                      );
                    } else {
                      setVerificationState("input");
                      showRequestError(error);
                      if (method !== "recovery_code") {
                        // Clear the rejected code and return focus so retyping is immediate.
                        setOtp("");
                        requestAnimationFrame(() => code.current?.focus());
                      }
                    }
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {method !== "recovery_code" ? (
                  <OtpInput
                    key={method}
                    ref={code}
                    id="login-code"
                    name="code"
                    label={
                      method === "email_otp" ? "Email code" : "Verification code"
                    }
                    required
                    disabled={busy || challengeExpired || emailInputDisabled}
                    error={fields.code}
                    value={otp}
                    onValueChange={setOtp}
                  />
                ) : (
                  <Input
                    key="recovery_code"
                    ref={code}
                    id="login-code"
                    name="code"
                    label="Recovery code"
                    autoComplete="one-time-code"
                    inputMode="text"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={64}
                    required
                    disabled={challengeExpired}
                    icon={<Icon name="lock" />}
                    error={fields.code}
                    placeholder="XXXX-XXXX-…"
                  />
                )}
                <Button
                  type="submit"
                  disabled={busy || challengeExpired || emailInputDisabled}
                  fullWidth
                  icon={<Icon name="check" />}
                >
                  {method === "email_otp"
                    ? "Verify email"
                    : "Verify and continue"}
                </Button>
              </Form>
            )}
            <div className={styles.secondaryActions}>
              {!challengeExpired &&
                methodOptions.map(([item, label]) =>
                  item !== method && methods.includes(item) ? (
                    <button
                      key={item}
                      type="button"
                      className={styles.link}
                      disabled={busy}
                      onClick={() => changeMethod(item)}
                    >
                      {label}
                    </button>
                  ) : null,
                )}
              <button
                type="button"
                className={styles.link}
                disabled={busy}
                onClick={restart}
              >
                Back to sign in
              </button>
            </div>
          </>
        ) : (
          <div className={styles.followUp}>
            <p>
              This account needs an approved authenticator before it can access
              platform administration. Contact your platform administrator to
              complete enrollment.
            </p>
            <Button variant="secondary" disabled={busy} onClick={restart}>
              Back to sign in
            </Button>
          </div>
        ))}
    </div>
  );
}
