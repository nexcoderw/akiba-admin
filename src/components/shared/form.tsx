"use client";

import {
  createContext, useContext, useRef, useState,
  type FormEvent, type FormHTMLAttributes,
} from "react";
import styles from "./controls.module.css";

const SubmissionContext = createContext(false);

export function useSubmissionPending() {
  return useContext(SubmissionContext);
}

export type FormProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "onSubmit" | "action" | "method" | "target" | "onSubmitCapture"
> & {
  onSubmitAction: (data: FormData) => Promise<void>;
  onErrorAction?: (error: unknown) => void;
  errorMessage?: string;
};

/** Captures FormData before disabling submit buttons and gates Enter as well as clicks. */
export function Form({
  onSubmitAction,
  onErrorAction,
  errorMessage = "We couldn't confirm this action. Check its status before trying again.",
  children,
  ...props
}: FormProps) {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
    submitting.current = true;
    setFailed(false);
    try {
      const data = new FormData(form, submitter);
      setPending(true);
      await onSubmitAction(data);
    } catch (error: unknown) {
      setFailed(true);
      onErrorAction?.(error);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <SubmissionContext value={pending}>
      <form {...props} method="post" onSubmit={handleSubmit} aria-busy={pending || props["aria-busy"]}>
        {children}
        {failed && <p className={styles.error} role="alert">{errorMessage}</p>}
      </form>
    </SubmissionContext>
  );
}
