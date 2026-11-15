import type { ReactNode } from "react";
import styles from "./controls.module.css";

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export function descriptionIds(
  id: string,
  hint?: string,
  error?: string,
  external?: string,
) {
  return [hint && `${id}-hint`, error && `${id}-error`, external]
    .filter(Boolean)
    .join(" ") || undefined;
}

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldProps & { required?: boolean; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} id={`${id}-label`} htmlFor={id}>
        {label}
        {required && <span className={styles.required}> (required)</span>}
      </label>
      {children}
      {hint && <p className={styles.hint} id={`${id}-hint`}>{hint}</p>}
      {error && <p className={styles.error} id={`${id}-error`}>{error}</p>}
    </div>
  );
}
