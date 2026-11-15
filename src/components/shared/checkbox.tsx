import type { InputHTMLAttributes, Ref } from "react";
import { descriptionIds, type FieldProps } from "./field";
import styles from "./checkbox.module.css";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "children"> &
  FieldProps & { ref?: Ref<HTMLInputElement> };

export function Checkbox({
  id, label, hint, error, className = "", ref, ...props
}: CheckboxProps) {
  return (
    <div className={styles.field}>
      <label className={styles.choice} htmlFor={id}>
        <input
          {...props}
          ref={ref}
          id={id}
          type="checkbox"
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={descriptionIds(id, hint, error, props["aria-describedby"])}
          className={`${styles.choiceInput} ${className}`}
        />
        <span>{label}{props.required && <span className={styles.required}> (required)</span>}</span>
      </label>
      {hint && <p className={styles.choiceHint} id={`${id}-hint`}>{hint}</p>}
      {error && <p className={styles.error} id={`${id}-error`}>{error}</p>}
    </div>
  );
}
