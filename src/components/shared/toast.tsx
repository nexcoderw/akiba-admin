"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "./icon";
import styles from "./toast.module.css";

type ToastTone = "success" | "error" | "info" | "warning";

interface ToastOptions {
  message: string;
  title?: string;
  tone?: ToastTone;
  /** Zero keeps a toast visible until dismissed. Nonzero values have a five-second minimum. */
  duration?: number;
}

interface ToastRecord extends Required<Omit<ToastOptions, "title">> {
  id: number;
  title?: string;
}

interface ToastApi {
  show: (options: ToastOptions) => number;
  success: (message: string) => number;
  error: (message: string) => number;
  info: (message: string) => number;
  warning: (message: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const icons: Record<ToastTone, IconName> = {
  success: "check",
  error: "error",
  info: "info",
  warning: "warning",
};

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => {
    document.removeEventListener("visibilitychange", callback);
  };
}

function readVisibility() {
  return document.hidden;
}
function serverVisibility() {
  return false;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [announcement, setAnnouncement] = useState<ToastRecord | null>(null);
  const sequence = useRef(0);
  const viewportRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const dismiss = useCallback((id: number) => {
    const focused = viewportRef.current
      ?.querySelector(`[data-toast-id="${id}"]`)
      ?.contains(document.activeElement);
    setToasts((current) => current.filter((toast) => toast.id !== id));
    if (focused) {
      requestAnimationFrame(() => {
        const next =
          viewportRef.current?.querySelector<HTMLButtonElement>("button");
        if (next) next.focus();
        else if (returnFocusRef.current?.isConnected)
          returnFocusRef.current.focus();
      });
    }
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = ++sequence.current;
    const tone = options.tone ?? "info";
    const requestedDuration = options.duration ?? (tone === "error" ? 0 : 6000);
    const duration =
      requestedDuration === 0
        ? 0
        : Number.isFinite(requestedDuration)
          ? Math.min(60000, Math.max(5000, requestedDuration))
          : 6000;
    const focusedId =
      document.activeElement?.closest<HTMLElement>("[data-toast-id]")?.dataset
        .toastId;
    const toast: ToastRecord = { ...options, id, tone, duration };
    setAnnouncement(toast);
    setToasts((current) => {
      // Bound the stack without removing a notification that currently owns keyboard focus.
      const oldest = current.find((item) => String(item.id) !== focusedId);
      const retained =
        current.length >= 4 && oldest
          ? current.filter((item) => item.id !== oldest.id)
          : current;
      return [...retained, toast];
    });
    return id;
  }, []);

  // Stable context and callbacks keep unrelated notifications from restarting dismissal effects.
  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (message) => show({ message, tone: "success" }),
      error: (message) => show({ message, tone: "error" }),
      info: (message) => show({ message, tone: "info" }),
      warning: (message) => show({ message, tone: "warning" }),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext value={api}>
      {children}
      <section
        ref={viewportRef}
        aria-label="Notifications"
        className={styles.viewport}
        onFocusCapture={(event) => {
          if (
            event.relatedTarget instanceof HTMLElement &&
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            returnFocusRef.current = event.relatedTarget;
          }
        }}
      >
        <p role="status" aria-atomic="true" className={styles.srOnly}>
          {announcement && announcement.tone !== "error" && (
            <span key={announcement.id}>
              {announcement.tone}: {announcement.title} {announcement.message}
            </span>
          )}
        </p>
        <p role="alert" aria-atomic="true" className={styles.srOnly}>
          {announcement?.tone === "error" && (
            <span key={announcement.id}>
              Error: {announcement.title} {announcement.message}
            </span>
          )}
        </p>
        <ol className={styles.list}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </ol>
      </section>
    </ToastContext>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside ToastProvider.");
  return api;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    readVisibility,
    serverVisibility,
  );
  const remaining = useRef(toast.duration);
  const paused = hovered || focused || hidden;

  useEffect(() => {
    if (!toast.duration || paused) return;
    const started = performance.now();
    const timer = window.setTimeout(
      () => onDismiss(toast.id),
      remaining.current,
    );
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(
        0,
        remaining.current - (performance.now() - started),
      );
    };
  }, [paused, toast.duration, toast.id, onDismiss]);

  return (
    <li
      className={styles.toast}
      data-tone={toast.tone}
      data-toast-id={toast.id}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onDismiss(toast.id);
        }
      }}
    >
      <span className={styles.icon} aria-hidden="true">
        <Icon name={icons[toast.tone]} />
      </span>
      <div className={styles.message}>
        {toast.title && <p className={styles.title}>{toast.title}</p>}
        <p>{toast.message}</p>
      </div>
      <button
        type="button"
        className={styles.close}
        aria-label={`Dismiss ${toast.tone} notification`}
        onClick={() => onDismiss(toast.id)}
      >
        <Icon name="close" />
      </button>
    </li>
  );
}
