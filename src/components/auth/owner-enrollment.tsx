"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/button";
import { Checkbox } from "@/components/shared/checkbox";
import { Form } from "@/components/shared/form";
import { Input } from "@/components/shared/input";
import { AuthRequestError, authRequest } from "@/lib/auth/browser";
import {
  parseEnrollmentComplete,
  parseEnrollmentSetup,
  parseEnrollmentState,
  validEnrollmentBody,
  type AuthOperation,
} from "@/lib/auth/contracts";
import styles from "./owner-enrollment.module.css";

type Step =
  | { kind: "start" }
  | { kind: "password"; expiresAt: string }
  | {
      kind: "mfa";
      expiresAt: string;
      setup?: { secret: string; version: number };
    }
  | { kind: "complete"; recoveryCodes: string[] }
  | { kind: "uncertain" };

export function OwnerEnrollment() {
  const [step, setStep] = useState<Step>({ kind: "start" });
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const mailboxProof = useRef<HTMLInputElement>(null);
  const active = useRef(true);
  const locked = useRef(false);
  const password = useRef<HTMLInputElement>(null);
  const confirmation = useRef<HTMLInputElement>(null);
  const code = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  useEffect(() => {
    heading.current?.focus();
  }, [step.kind]);

  async function run(operation: AuthOperation, body: unknown = {}) {
    if (locked.current) return null;
    locked.current = true;
    setBusy(true);
    setMessage(undefined);
    try {
      const result = await authRequest(operation, body);
      return active.current ? result : null;
    } catch (error: unknown) {
      if (active.current) {
        setMessage(
          error instanceof AuthRequestError
            ? error.message
            : "We couldn't confirm this action. Please try again.",
        );
        if (
          operation === "enrollmentComplete" &&
          (!(error instanceof AuthRequestError) ||
            error.problem.status === 0 ||
            error.problem.status >= 500)
        ) {
          setStep({ kind: "uncertain" });
        }
      }
      return null;
    } finally {
      locked.current = false;
      if (active.current) setBusy(false);
    }
  }

  function state(value: unknown) {
    const result = parseEnrollmentState(value);
    if (!result) {
      setMessage(
        "We couldn't confirm enrollment. Check its status before continuing.",
      );
      return;
    }
    setStep({ kind: result.stage, expiresAt: result.expiresAt });
  }

  async function resume() {
    const result = await run("enrollmentStatus");
    if (result) state(result.data);
  }

  const position =
    step.kind === "start"
      ? 1
      : step.kind === "password"
        ? 2
        : step.kind === "mfa"
          ? 3
          : 4;
  return (
    <section
      className={styles.panel}
      aria-labelledby="owner-enrollment-title"
      aria-busy={busy}
    >
      <p className={styles.eyebrow} aria-live="polite" aria-atomic="true">
        First platform owner · Step {position} of 4
      </p>
      <h1
        ref={heading}
        id="owner-enrollment-title"
        className={styles.title}
        tabIndex={-1}
      >
        Secure your Akiba workspace
      </h1>
      <p className={styles.intro}>
        Verify your mailbox, create a strong password and protect your account
        with an authenticator.
      </p>
      {message && (
        <p className={styles.problem} role="alert">
          {message}
        </p>
      )}
      {step.kind === "start" && (
        <div className={styles.stack}>
          <p>
            Open the email sent by your approved operator and paste its
            single-use setup code below. Your account stays pending until all
            verification steps are complete.
          </p>
          <Form
            className={styles.stack}
            onSubmitAction={async (data) => {
              const token = data.get("token");
              if (
                typeof token !== "string" ||
                !validEnrollmentBody("enrollmentExchange", { token })
              ) {
                setMessage(
                  "Paste the complete setup code from your enrollment email.",
                );
                mailboxProof.current?.focus();
                return;
              }
              const result = await run("enrollmentExchange", { token });
              if (mailboxProof.current) mailboxProof.current.value = "";
              if (result) state(result.data);
            }}
          >
            <Input
              ref={mailboxProof}
              id="owner-mailbox-proof"
              name="token"
              label="Setup code from email"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              minLength={43}
              maxLength={43}
              required
            />
            <Button
              type="submit"
              fullWidth
              disabled={busy}
              loadingLabel="Verifying your email…"
            >
              Verify email and continue
            </Button>
          </Form>
          <Button
            fullWidth
            variant="secondary"
            disabled={busy}
            loadingLabel="Checking enrollment…"
            onClick={resume}
          >
            Resume this browser&apos;s setup
          </Button>
          <p className={styles.hint}>
            Setup codes and restricted sessions expire after 15 minutes. After
            an uncertain verification response, try resuming before requesting a
            new email.
          </p>
        </div>
      )}
      {step.kind === "password" && (
        <Form
          className={styles.stack}
          onSubmitAction={async (data) => {
            const value = data.get("password");
            const repeat = data.get("confirmation");
            if (
              typeof value !== "string" ||
              !validEnrollmentBody("enrollmentPassword", { password: value }) ||
              value !== repeat
            ) {
              setMessage(
                "Use 8–1024 characters and make sure both passwords match.",
              );
              password.current?.focus();
              return;
            }
            const result = await run("enrollmentPassword", { password: value });
            if (password.current) password.current.value = "";
            if (confirmation.current) confirmation.current.value = "";
            if (result) state(result.data);
          }}
        >
          <Input
            ref={password}
            id="owner-password"
            name="password"
            label="Create password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={4096}
            required
            hint="Use a unique passphrase of at least 8 characters. A password manager is recommended."
          />
          <Input
            ref={confirmation}
            id="owner-password-confirmation"
            name="confirmation"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={4096}
            required
          />
          <Button
            type="submit"
            fullWidth
            disabled={busy}
            loadingLabel="Protecting your password…"
          >
            Save password
          </Button>
        </Form>
      )}
      {step.kind === "mfa" && (
        <div className={styles.stack}>
          {!step.setup ? (
            <>
              <h2>Connect your authenticator</h2>
              <p>
                Use an authenticator app that supports time-based codes. Your
                account stays pending until you verify its first code.
              </p>
              <Button
                fullWidth
                disabled={busy}
                loadingLabel="Preparing authenticator…"
                onClick={async () => {
                  const result = await run("enrollmentSetup");
                  if (!result) return;
                  const setup = parseEnrollmentSetup(result.data);
                  if (setup) setStep({ ...step, setup });
                  else
                    setMessage(
                      "We couldn't confirm the setup key. Check enrollment status before trying again.",
                    );
                }}
              >
                Generate setup key
              </Button>
              <p className={styles.hint}>
                Returning after a refresh generates a new key and invalidates
                the previous unverified key. You can generate up to three keys
                per enrollment session.
              </p>
            </>
          ) : (
            <>
              <h2>Add an Akiba account in your authenticator</h2>
              <ol className={styles.instructions}>
                <li>Choose manual entry and enter the setup key below.</li>
                <li>Select time-based codes: six digits, 30 seconds, SHA1.</li>
                <li>Enter the current code to complete setup.</li>
              </ol>
              <div
                className={styles.secret}
                aria-label="Authenticator setup key"
              >
                {step.setup.secret}
              </div>
              <p className={styles.hint}>
                Keep this key private. Never send it to support or enter it on
                another website.
              </p>
              <Form
                className={styles.stack}
                onSubmitAction={async (data) => {
                  const value = data.get("code");
                  if (
                    typeof value !== "string" ||
                    !/^\d{6}$/u.test(value) ||
                    !step.setup
                  ) {
                    setMessage(
                      "Enter the six-digit code from your authenticator.",
                    );
                    code.current?.focus();
                    return;
                  }
                  const result = await run("enrollmentComplete", {
                    code: value,
                    version: step.setup.version,
                  });
                  if (code.current) code.current.value = "";
                  if (!result) return;
                  const complete = parseEnrollmentComplete(result.data);
                  if (complete)
                    setStep({
                      kind: "complete",
                      recoveryCodes: complete.recoveryCodes,
                    });
                  else {
                    setStep({ kind: "uncertain" });
                    setMessage(
                      "We couldn't confirm the final response. Use normal sign-in to check access.",
                    );
                  }
                }}
              >
                <Input
                  ref={code}
                  id="owner-totp-code"
                  name="code"
                  label="Verification code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  disabled={busy}
                  loadingLabel="Verifying and securing your account…"
                >
                  Verify and activate account
                </Button>
              </Form>
            </>
          )}
        </div>
      )}
      {(step.kind === "password" || step.kind === "mfa") && (
        <div className={styles.footer}>
          <p className={styles.hint}>
            Setup expires at {new Date(step.expiresAt).toLocaleTimeString()}. No
            administration session is active.
          </p>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              const result = await run("enrollmentStatus");
              if (result) state(result.data);
            }}
          >
            Check setup status
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              const result = await run("enrollmentCancel");
              if (result) {
                setStep({ kind: "start" });
                setMessage(
                  "Setup ended. Ask your operator for a new enrollment email to continue.",
                );
              }
            }}
          >
            End setup
          </Button>
        </div>
      )}
      {step.kind === "complete" && (
        <div className={styles.stack}>
          <h2>Your account is ready. Save your recovery codes.</h2>
          <p>
            Each code works once. Store them in a trusted password manager or
            another secure offline location. They will not be shown again.
          </p>
          <ul className={styles.codes} aria-label="Single-use recovery codes">
            {step.recoveryCodes.map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
          <Checkbox
            id="owner-recovery-saved"
            label="I have securely saved my recovery codes"
            checked={saved}
            onChange={(event) => setSaved(event.target.checked)}
          />
          <Button
            fullWidth
            disabled={!saved}
            onClick={() => {
              setStep({ kind: "start" });
              window.location.replace("/login");
            }}
          >
            Continue to sign in
          </Button>
          <p className={styles.hint}>
            Wait for a new authenticator code before signing in. The setup code
            cannot be reused.
          </p>
        </div>
      )}
      {step.kind === "uncertain" && (
        <div className={styles.stack}>
          <p>
            Activation may have completed. Sign in with your password and
            authenticator. Recovery codes cannot be shown again after
            activation; use approved MFA management to replace them if needed.
          </p>
          <Link href="/login" className={styles.link}>
            Check access by signing in
          </Link>
        </div>
      )}
      {step.kind === "start" && (
        <Link href="/login" className={styles.link}>
          Already enrolled? Sign in
        </Link>
      )}
    </section>
  );
}
