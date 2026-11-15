"use client";

import {
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useFormStatus } from "react-dom";
import { useSubmissionPending } from "./form";
import { Icon } from "./icon";
import styles from "./button.module.css";

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> & {
  ref?: Ref<HTMLButtonElement>;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  pending?: boolean;
  loadingIconOnly?: boolean;
  loadingLabel?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  onActionError?: (error: unknown) => void;
};

export function Button({
  icon,
  variant = "primary",
  size = "md",
  fullWidth = false,
  pending = false,
  loadingIconOnly = false,
  loadingLabel = "Working…",
  type = "button",
  disabled,
  className = "",
  onClick,
  onActionError,
  children,
  ref,
  ...props
}: ButtonProps) {
  const formStatus = useFormStatus();
  const formPending = useSubmissionPending();
  const clickLocked = useRef(false);
  const [clickPending, setClickPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy =
    pending ||
    clickPending ||
    (type === "submit" && (formStatus.pending || formPending));

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (busy || clickLocked.current) {
      event.preventDefault();
      return;
    }
    if (!onClick) return;
    clickLocked.current = true;
    setFailed(false);
    try {
      const result = onClick(event);
      if (result && typeof result.then === "function") {
        // Async click actions must not also trigger a separate native form submission.
        if (type === "submit") event.preventDefault();
        setClickPending(true);
        await result;
      }
    } catch (error: unknown) {
      event.preventDefault();
      setFailed(true);
      onActionError?.(error);
    } finally {
      clickLocked.current = false;
      setClickPending(false);
    }
  }

  return (
    <>
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || busy}
        aria-busy={busy}
        aria-label={
          busy && loadingIconOnly ? loadingLabel : props["aria-label"]
        }
        className={`${styles.button} ${className}`}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth || undefined}
        data-pending={busy || undefined}
        data-loading-icon-only={loadingIconOnly || undefined}
        data-failed={failed || undefined}
        onClick={handleClick}
      >
        {/* Decorative light sweep; clipped to the pill shape. */}
        <span className={styles.shine} aria-hidden="true" />
        <span className={styles.content} aria-hidden={busy}>
          <span className={styles.icon} aria-hidden="true">
            {icon ?? <Icon name="arrow-right" />}
          </span>
          <span className={styles.label}>{children}</span>
        </span>
        <span
          className={styles.loading}
          aria-hidden={!busy || loadingIconOnly}
        >
          <span className={styles.orbit} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {!loadingIconOnly && <span>{loadingLabel}</span>}
        </span>
      </button>
      {failed && (
        <span className={styles.error} role="alert">
          We couldn&apos;t confirm this action. Check its status before trying
          again.
        </span>
      )}
    </>
  );
}
