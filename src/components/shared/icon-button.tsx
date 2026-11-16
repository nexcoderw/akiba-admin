import type { ButtonHTMLAttributes, Ref } from "react";
import { Icon, type IconName } from "./icon";
import styles from "./icon-button.module.css";

interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "aria-label" | "title"
> {
  ref?: Ref<HTMLButtonElement>;
  icon: IconName;
  label: string;
  variant?: "ghost" | "outline";
}

export function IconButton({
  icon,
  label,
  variant = "ghost",
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      title={label}
      data-variant={variant}
      className={`${styles.button} ${className}`}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
