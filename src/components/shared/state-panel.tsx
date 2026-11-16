import { useId, type ReactNode } from "react";
import { Icon } from "./icon";
import styles from "./state-panel.module.css";

export function StatePanel({
  kind,
  layout = "section",
  headingLevel = 1,
  title,
  description,
  children,
}: {
  kind: "empty" | "loading";
  layout?: "page" | "section" | "compact";
  headingLevel?: 1 | 2 | 3;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  const id = useId();
  const Heading = headingLevel === 1 ? "h1" : headingLevel === 2 ? "h2" : "h3";
  return (
    <section
      className={styles.panel}
      data-layout={layout}
      data-state={kind}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
    >
      {kind === "loading" ? (
        <div className={styles.loading} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          <Heading id={`${id}-title`} className={styles.loadingTitle}>
            {title}
          </Heading>
        </div>
      ) : (
        <>
          <div className={styles.illustration} aria-hidden="true">
            <svg
              className={styles.scene}
              viewBox="0 0 224 160"
              fill="none"
              focusable="false"
            >
              <rect
                className={styles.frame}
                x="30"
                y="24"
                width="164"
                height="112"
                rx="14"
              />
              <path
                className={styles.rule}
                d="M30 49h164M47 68h25M47 81h17M47 110h25M159 110h18"
              />
              <circle className={styles.detail} cx="44" cy="37" r="2" />
              <circle className={styles.detail} cx="52" cy="37" r="2" />
              <circle className={styles.detail} cx="60" cy="37" r="2" />
              <circle className={styles.accent} cx="204" cy="44" r="4" />
              <circle className={styles.accent} cx="19" cy="111" r="3" />
              <path
                className={styles.rule}
                d="M17 62v10m-5-5h10M201 104v10m-5-5h10"
              />
            </svg>
            <div className={styles.glyph}>
              <Icon name="building" size={40} />
            </div>
          </div>
          <Heading id={`${id}-title`} className={styles.title}>
            {title}
          </Heading>
        </>
      )}
      {description && (
        <p id={`${id}-description`} className={styles.description}>
          {description}
        </p>
      )}
      {children && <div className={styles.actions}>{children}</div>}
    </section>
  );
}
