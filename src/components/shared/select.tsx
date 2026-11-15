"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { descriptionIds, Field, type FieldProps } from "./field";
import { Icon } from "./icon";
import styles from "./select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectBaseProps extends FieldProps {
  name: string;
  options: readonly SelectOption[];
  icon?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  form?: string;
  className?: string;
  "aria-describedby"?: string;
}

type SingleSelectProps = SelectBaseProps & {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

type MultipleSelectProps = SelectBaseProps & {
  multiple: true;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
};

export type SelectProps = SingleSelectProps | MultipleSelectProps;

export function Select(props: SelectProps) {
  if (props.multiple) return <MultipleSelect {...props} />;
  const {
    id, label, hint, error, icon, name, options, disabled, required, form,
    placeholder = "Select an option", className = "", value, defaultValue, onValueChange,
  } = props;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <div className={styles.control}>
        <span className={styles.leadingIcon} aria-hidden="true">{icon ?? <Icon name="list" />}</span>
        <select
          id={id}
          name={name}
          form={form}
          value={value}
          defaultValue={value === undefined ? defaultValue ?? "" : undefined}
          disabled={disabled}
          required={required}
          onChange={(event) => onValueChange?.(event.currentTarget.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionIds(id, hint, error, props["aria-describedby"])}
          className={`${styles.input} ${styles.select} ${className}`}
        >
          <option value="" disabled={required}>{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
          ))}
        </select>
        <span className={styles.trailingIcon} aria-hidden="true"><Icon name="chevron-down" /></span>
      </div>
    </Field>
  );
}

function MultipleSelect({
  id, label, hint, error, icon, name, options, disabled, required, form,
  placeholder = "Select options", className = "", value, defaultValue,
  onValueChange, "aria-describedby": externalDescription,
}: MultipleSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nativeRef = useRef<HTMLSelectElement>(null);
  const [internalValue, setInternalValue] = useState<readonly string[]>(defaultValue ?? []);
  const [open, setOpen] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const selected = value ?? internalValue;
  const enabled = options.filter((option) => !option.disabled);
  const labels = options.filter((option) => selected.includes(option.value)).map((option) => option.label);
  const fieldError = error || (validationError ? "Select at least one option." : undefined);

  function update(next: string[]) {
    if (value === undefined) setInternalValue(next);
    setValidationError(false);
    onValueChange?.(next);
  }

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  useEffect(() => {
    const owner = nativeRef.current?.form;
    if (!owner) return;
    function reset(event: Event) {
      // Wait until all reset listeners have had the opportunity to cancel the reset.
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setInternalValue([...(defaultValue ?? [])]);
        setValidationError(false);
        setOpen(false);
      });
    }
    owner.addEventListener("reset", reset);
    return () => {
      owner.removeEventListener("reset", reset);
    };
  }, [defaultValue, form, value]);

  return (
    <Field id={id} label={label} hint={hint} error={fieldError} required={required}>
      <div
        ref={rootRef}
        className={styles.multiRoot}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            triggerRef.current?.focus();
          }
        }}
      >
        {/* Native select supplies standard repeated FormData entries and required validation. */}
        <select
          ref={nativeRef}
          className={styles.nativeProxy}
          name={name}
          form={form}
          multiple
          value={selected}
          disabled={disabled}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => update(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}
          onInvalid={(event) => {
            event.preventDefault();
            setValidationError(true);
            const firstInvalid = event.currentTarget.form
              ? Array.from(event.currentTarget.form.elements).find((element) => element.matches(":invalid"))
              : undefined;
            if (!firstInvalid || firstInvalid === event.currentTarget) {
              requestAnimationFrame(() => triggerRef.current?.focus());
            }
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
          ))}
        </select>
        <div className={styles.control}>
          <span className={styles.leadingIcon} aria-hidden="true">{icon ?? <Icon name="list" />}</span>
          <button
            ref={triggerRef}
            id={id}
            type="button"
            disabled={disabled}
            aria-labelledby={`${id}-label ${id}-value`}
            aria-expanded={open && !disabled}
            aria-controls={`${id}-options`}
            aria-describedby={descriptionIds(id, hint, fieldError, externalDescription)}
            data-invalid={fieldError ? true : undefined}
            className={`${styles.input} ${styles.multiTrigger} ${className}`}
            onClick={() => setOpen((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                requestAnimationFrame(() => rootRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus());
              }
            }}
          >
            <span id={`${id}-value`} className={styles.selectValue} data-placeholder={!labels.length || undefined}>
              {labels.length ? labels.join(", ") : placeholder}
            </span>
            {labels.length > 0 && <span className={styles.count} aria-hidden="true">{labels.length}</span>}
          </button>
          <span className={styles.trailingIcon} aria-hidden="true"><Icon name="chevron-down" /></span>
        </div>
        <div id={`${id}-options`} hidden={!open || disabled} className={styles.dropdown}>
          <div className={styles.dropdownHeading}>
            <span>Choose one or more</span>
            <button type="button" className={styles.textButton} onClick={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}>Done</button>
          </div>
          <div role="group" aria-labelledby={`${id}-label`} className={styles.optionList}>
            {options.length === 0 && <p className={styles.hint}>No options available.</p>}
            {options.map((option, index) => (
              <label key={option.value} className={styles.option} data-selected={selected.includes(option.value) || undefined}>
                <input
                  id={`${id}-option-${index}`}
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  disabled={disabled || option.disabled}
                  className={styles.choiceInput}
                  onChange={(event) => update(event.currentTarget.checked
                    ? [...selected, option.value]
                    : selected.filter((item) => item !== option.value))}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {enabled.length > 0 && <p className={styles.dropdownHint}>Use Tab to move and Space to select.</p>}
        </div>
      </div>
    </Field>
  );
}
