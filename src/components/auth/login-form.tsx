"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/button";
import { Form } from "@/components/shared/form";
import { Icon } from "@/components/shared/icon";
import { Input } from "@/components/shared/input";
import { OtpInput } from "@/components/shared/otp-input";
import {
  AuthRequestError,
  readSession,
  startLogin,
  verifyMfa,
} from "@/lib/auth/browser";
import {
  loginErrors,
  safeDestination,
  validVerificationBody,
  type Challenge,
  type SafeProblem,
} from "@/lib/auth/contracts";
import { LogoutButton } from "./logout-button";
import styles from "./login-form.module.css";

type Step =
  | { kind: "password" }
  | { kind: "mfa"; challenge: Challenge | null }
  | { kind: "confirming" }
  | { kind: "recovery" };

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
    pendingOnLoad ? { kind: "mfa", challenge: null } : { kind: "password" },
  );
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"totp" | "recovery_code">("totp");
  const [fields, setFields] = useState<{
    email?: string;
    password?: string;
    code?: string;
  }>({});
  const [problem, setProblem] = useState<SafeProblem>();
  const [challengeExpired, setChallengeExpired] = useState(false);
  const [otp, setOtp] = useState("");
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const code = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (step.kind !== "password") heading.current?.focus();
    if (step.kind !== "mfa" || !step.challenge) return;
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

  function showError(error: unknown) {
    setProblem(
      error instanceof AuthRequestError
        ? error.problem
        : {
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            message:
              "The service is temporarily unavailable. Please try again.",
          },
    );
  }

  async function confirmSession() {
    setProblem(undefined);
    const result = await readSession();
    if (result.kind === "authenticated") {
      window.location.replace(safeDestination(next));
    } else if (result.kind === "denied" || result.kind === "unavailable") {
      setProblem(result.problem);
    } else {
      setProblem({
        status: 401,
        code: "AUTH_SESSION_EXPIRED",
        message:
          "Your session couldn't be confirmed. Start again or retry the session check.",
      });
    }
  }

  function restart() {
    if (busy) return;
    if (code.current) code.current.value = "";
    setOtp("");
    setFields({});
    setProblem(undefined);
    setVisible(false);
    setChallengeExpired(false);
    setMethod("totp");
    setStep({ kind: "password" });
  }

  const title =
    step.kind === "password"
      ? "Welcome back"
      : step.kind === "mfa"
        ? "Verify your sign-in"
        : step.kind === "recovery"
          ? "Recovery verification received"
          : "Confirming your access";
  const methods =
    step.kind === "mfa" ? (step.challenge?.methods ?? ["totp"]) : [];
  const canVerify =
    methods.includes("totp") || methods.includes("recovery_code");

  return (
    <div className={styles.login}>
      <header className={styles.header}>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <p>
          {step.kind === "password"
            ? "Sign in to your Akiba administration workspace."
            : step.kind === "mfa"
              ? method === "totp"
                ? "Enter the six-digit code from your authenticator app."
                : "Enter one of your unused recovery codes."
              : step.kind === "recovery"
                ? "Your recovery proof was accepted. Full administration access remains locked until authenticator recovery is completed."
                : "We need to confirm your full platform session before continuing."}
        </p>
      </header>
      {expiredSession && step.kind === "password" && (
        <p className={styles.information} role="status">
          Your session ended. Sign in again to continue.
        </p>
      )}
      {Object.values(fields).some(Boolean) && (
        <p className={styles.validationSummary} role="alert">
          Please check the highlighted fields.
        </p>
      )}
      {problem && (
        <div className={styles.problem} role="alert">
          <Icon name="error" />
          <div>
            <p>{problem.message}</p>
            {problem.requestId && <small>Reference: {problem.requestId}</small>}
          </div>
        </div>
      )}
      {step.kind === "password" && (
        <Form
          className={styles.form}
          noValidate
          onSubmitAction={async (data) => {
            setProblem(undefined);
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
              setMethod(
                challenge.methods.includes("totp") ? "totp" : "recovery_code",
              );
              setStep({ kind: "mfa", challenge });
            } catch (error: unknown) {
              showError(error);
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
      {step.kind === "mfa" &&
        (canVerify ? (
          <>
            {challengeExpired && (
              <p className={styles.problem} role="alert">
                This sign-in request has expired. Start again to continue.
              </p>
            )}
            <Form
              className={styles.form}
              noValidate
              onSubmitAction={async (data) => {
                setProblem(undefined);
                const raw = data.get("code");
                const value = typeof raw === "string" ? raw.trim() : "";
                const body =
                  method === "totp"
                    ? { method, totpCode: value }
                    : { method, recoveryCode: value };
                if (!validVerificationBody(body)) {
                  setFields({
                    code:
                      method === "totp"
                        ? "Enter a six-digit verification code."
                        : "Enter a valid recovery code, including its hyphens.",
                  });
                  code.current?.focus();
                  return;
                }
                if (challengeExpired) return;
                setFields({});
                setBusy(true);
                try {
                  const verified = await verifyMfa(method, value);
                  if (code.current) code.current.value = "";
                  if (verified.status === "mfa_recovery_required") {
                    setStep({ kind: "recovery" });
                    return;
                  }
                  setStep({ kind: "confirming" });
                  await confirmSession();
                } catch (error: unknown) {
                  if (
                    error instanceof AuthRequestError &&
                    (error.problem.status === 0 || error.problem.status >= 500)
                  ) {
                    if (code.current) code.current.value = "";
                    setStep({ kind: "confirming" });
                    setProblem({
                      ...error.problem,
                      message:
                        "We couldn't confirm verification. Check your session before submitting another code.",
                    });
                  } else {
                    showError(error);
                    if (method === "totp") {
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
              {method === "totp" ? (
                <OtpInput
                  key="totp"
                  ref={code}
                  id="login-code"
                  name="code"
                  label="Verification code"
                  required
                  disabled={challengeExpired}
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
                disabled={challengeExpired}
                fullWidth
                loadingLabel="Verifying…"
                icon={<Icon name="check" />}
              >
                Verify and continue
              </Button>
            </Form>
            <div className={styles.secondaryActions}>
              {methods.includes("totp") &&
                methods.includes("recovery_code") && (
                  <button
                    type="button"
                    className={styles.link}
                    disabled={busy}
                    onClick={() => {
                      if (code.current) code.current.value = "";
                      setOtp("");
                      setMethod(method === "totp" ? "recovery_code" : "totp");
                      setFields({});
                      setProblem(undefined);
                    }}
                  >
                    {method === "totp"
                      ? "Use a recovery code"
                      : "Use my authenticator"}
                  </button>
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
      {step.kind === "confirming" && (
        <div className={styles.actionRow}>
          <Button
            fullWidth
            pending={busy}
            onClick={confirmSession}
            loadingLabel="Checking"
            icon={<Icon name="check" />}
          >
            Check again
          </Button>
          <LogoutButton
            label="Cancel"
            disabled={busy}
            fullWidth
            icon={<Icon name="close" />}
          />
        </div>
      )}
      {step.kind === "recovery" && (
        <div className={styles.followUp}>
          <p>
            Authenticator repair is not available in this frontend milestone.
            Contact your approved platform recovery administrator. This recovery
            session cannot open the platform workspace.
          </p>
          <LogoutButton label="End recovery session" />
        </div>
      )}
    </div>
  );
}
