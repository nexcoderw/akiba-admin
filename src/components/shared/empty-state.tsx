import { useId, type ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import styles from "./empty-state.module.css";

export function EmptyState({
  title,
  description,
  icon = "building",
  children,
}: {
  title: string;
  description: string;
  icon?: IconName;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <section
      className={styles.state}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <div className={styles.illustration} aria-hidden="true">
        <span className={styles.glyph}>
          <Icon name={icon} size={36} />
        </span>
      </div>
      <h2 id={`${id}-title`} className={styles.title}>
        {title}
      </h2>
      <p id={`${id}-description`} className={styles.description}>
        {description}
      </p>
      {children && <div className={styles.actions}>{children}</div>}
    </section>
  );
}
