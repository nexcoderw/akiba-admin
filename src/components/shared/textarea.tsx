import type { ReactNode, Ref, TextareaHTMLAttributes } from "react";
import { descriptionIds, Field, type FieldProps } from "./field";
import { Icon } from "./icon";
import styles from "./textarea.module.css";

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> &
  FieldProps & { ref?: Ref<HTMLTextAreaElement>; icon?: ReactNode };

export function Textarea({
  id, label, hint, error, icon, required, rows = 4, className = "", ref, ...props
}: TextareaProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <div className={styles.control}>
        <span className={`${styles.leadingIcon} ${styles.textareaIcon}`} aria-hidden="true">
          {icon ?? <Icon name="text" />}
        </span>
        <textarea
          {...props}
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={descriptionIds(id, hint, error, props["aria-describedby"])}
          className={`${styles.input} ${styles.textarea} ${className}`}
        />
      </div>
    </Field>
  );
}
