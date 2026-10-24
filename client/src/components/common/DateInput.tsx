"use client";

import { useRef } from "react";

import type { DateInputProps } from "@types";
import { FiCalendar } from "react-icons/fi";

import { DATE_INPUT_UI, INPUT_SIZES } from "@constants/designTokens";

const FIELD_SIZE = {
  [INPUT_SIZES.SM]: DATE_INPUT_UI.FIELD_SM,
  [INPUT_SIZES.MD]: DATE_INPUT_UI.FIELD_MD,
  [INPUT_SIZES.LG]: DATE_INPUT_UI.FIELD_LG,
} as const;

const INPUT_SIZE = {
  [INPUT_SIZES.SM]: DATE_INPUT_UI.INPUT_SM,
  [INPUT_SIZES.MD]: DATE_INPUT_UI.INPUT_MD,
  [INPUT_SIZES.LG]: DATE_INPUT_UI.INPUT_LG,
} as const;

const ICON_SIZE = {
  [INPUT_SIZES.SM]: DATE_INPUT_UI.ICON_SM,
  [INPUT_SIZES.MD]: DATE_INPUT_UI.ICON,
  [INPUT_SIZES.LG]: DATE_INPUT_UI.ICON,
} as const;

/**
 * Polished native date field: calendar icon, full-field hit target, Select-matching chrome.
 */
export default function DateInput({
  label,
  hint,
  error,
  size = INPUT_SIZES.MD,
  className = "",
  id,
  name,
  disabled,
  ...props
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = id ?? name;
  const hasError = Boolean(error);
  const fieldSize = FIELD_SIZE[size] ?? DATE_INPUT_UI.FIELD_MD;
  const inputSize = INPUT_SIZE[size] ?? DATE_INPUT_UI.INPUT_MD;
  const iconClass = ICON_SIZE[size] ?? DATE_INPUT_UI.ICON;

  const openPicker = () => {
    if (disabled) {
      return;
    }
    const el = inputRef.current;
    if (!el) {
      return;
    }
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
      } else {
        el.focus();
        el.click();
      }
    } catch {
      el.focus();
    }
  };

  return (
    <div className={`${DATE_INPUT_UI.ROOT} ${className}`.trim()}>
      {label ? (
        <label htmlFor={fieldId} className={DATE_INPUT_UI.LABEL}>
          {label}
        </label>
      ) : null}
      <div
        className={`${DATE_INPUT_UI.FIELD} ${fieldSize} ${hasError ? "border-destructive" : ""}`.trim()}
        onClick={openPicker}
      >
        <FiCalendar className={iconClass} aria-hidden />
        <input
          {...props}
          ref={inputRef}
          id={fieldId}
          name={name}
          type={DATE_INPUT_UI.INPUT_TYPE}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hint ? `${fieldId}-hint` : hasError ? `${fieldId}-error` : undefined}
          className={`${DATE_INPUT_UI.INPUT} ${inputSize} ${DATE_INPUT_UI.PICKER_HIT}`.trim()}
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
            props.onClick?.(e);
          }}
        />
      </div>
      {hint && !hasError ? (
        <p id={`${fieldId}-hint`} className={DATE_INPUT_UI.HINT}>
          {hint}
        </p>
      ) : null}
      {hasError ? (
        <p id={`${fieldId}-error`} className={DATE_INPUT_UI.ERROR}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
