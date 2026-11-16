"use client";

import { useId, useRef, useState } from "react";

import { IconButton } from "@/components/shared/icon-button";
import { Icon } from "@/components/shared/icon";
import styles from "./organization-search.module.css";

/**
 * Collapsed to an icon; opening grows the field from right to left. It filters only the organizations
 * already loaded in this view: the organization list API has no search parameter.
 */
export function OrganizationSearch({
  term,
  onTermChange,
}: {
  readonly term: string;
  readonly onTermChange: (term: string) => void;
}) {
  const inputId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  function close() {
    onTermChange("");
    setOpen(false);
    toggle.current?.focus();
  }
  return (
    <div
      className={styles.search}
      data-open={open}
      role={open ? "search" : undefined}
    >
      <button
        ref={toggle}
        type="button"
        className={styles.toggle}
        aria-label="Search organizations"
        title="Search organizations"
        aria-expanded={open}
        aria-controls={open ? inputId : undefined}
        onClick={() => {
          if (open) input.current?.focus();
          else setOpen(true);
        }}
      >
        <Icon name="search" size={18} aria-hidden="true" />
      </button>
      {open ? (
        <>
          <input
            ref={input}
            id={inputId}
            type="search"
            className={styles.input}
            value={term}
            placeholder="Search by name or slug…"
            aria-label="Search organizations in this view"
            autoComplete="off"
            spellCheck={false}
            maxLength={160}
            autoFocus
            onChange={(event) => onTermChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              // First Escape clears the term; a second one closes the field.
              event.preventDefault();
              if (term) onTermChange("");
              else close();
            }}
          />
          <IconButton
            icon="close"
            label="Close search"
            className={styles.close}
            onClick={close}
          />
        </>
      ) : null}
    </div>
  );
}
