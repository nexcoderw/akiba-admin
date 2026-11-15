import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { descriptionIds, type FieldProps } from "./field";
import styles from "./radio.module.css";

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "children" | "name" | "aria-invalid"> &
  FieldProps & { name: string; ref?: Ref<HTMLInputElement> };

export function Radio({ id, label, hint, error, className = "", ref, ...props }: RadioProps) {
  return (
    <div className={styles.field}>
      <label className={styles.choice} htmlFor={id}>
        <input
          {...props}
          ref={ref}
          id={id}
          type="radio"
          data-invalid={error ? true : undefined}
          aria-describedby={descriptionIds(id, hint, error, props["aria-describedby"])}
          className={`${styles.choiceInput} ${className}`}
        />
        <span>{label}</span>
      </label>
      {hint && <p className={styles.choiceHint} id={`${id}-hint`}>{hint}</p>}
      {error && <p className={styles.error} id={`${id}-error`}>{error}</p>}
    </div>
  );
}

export function RadioGroup({
  id, label, hint, error, disabled, children,
}: FieldProps & { disabled?: boolean; children: ReactNode }) {
  return (
    <fieldset
      id={id}
      className={styles.radioGroup}
      disabled={disabled}
      aria-describedby={descriptionIds(id, hint, error)}
      aria-invalid={error ? true : undefined}
    >
      <legend className={styles.label}>
        {label}
      </legend>
      {hint && <p className={styles.hint} id={`${id}-hint`}>{hint}</p>}
      <div className={styles.radioOptions}>{children}</div>
      {error && <p className={styles.error} id={`${id}-error`}>{error}</p>}
    </fieldset>
  );
}
