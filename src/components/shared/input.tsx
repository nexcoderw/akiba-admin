import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { descriptionIds, Field, type FieldProps } from "./field";
import { Icon } from "./icon";
import styles from "./input.module.css";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "size" | "type"> &
  FieldProps & {
    ref?: Ref<HTMLInputElement>;
    icon?: ReactNode;
    type?: "text" | "email" | "password" | "search" | "tel" | "url" | "number" | "date" | "datetime-local" | "time";
  };

export function Input({
  id, label, hint, error, icon, required, className = "", type = "text", ref, ...props
}: InputProps) {
  const defaultIcon = type === "email" ? "email" : type === "password" ? "lock" : "text";
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <div className={styles.control}>
        <span className={styles.leadingIcon} aria-hidden="true">{icon ?? <Icon name={defaultIcon} />}</span>
        <input
          {...props}
          ref={ref}
          id={id}
          type={type}
          required={required}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={descriptionIds(id, hint, error, props["aria-describedby"])}
          className={`${styles.input} ${className}`}
        />
      </div>
    </Field>
  );
}
