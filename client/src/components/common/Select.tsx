"use client";

import type { SelectProps } from "@types";
import { FiChevronDown } from "react-icons/fi";

import { INPUT_SIZES, SELECT_CHEVRON_CLASS, SELECT_SIZE_CLASS, SELECT_UI } from "@constants/designTokens";

/**
 * Native select with consistent chrome (chevron, focus ring, sizing) for filters and table footers.
 */
export default function Select({
  options,
  size = INPUT_SIZES.MD,
  fullWidth = true,
  className = "",
  selectClassName = "",
  disabled,
  ...props
}: SelectProps) {
  const wrapClass = fullWidth ? SELECT_UI.WRAP : SELECT_UI.WRAP_INLINE;
  const sizeClass = SELECT_SIZE_CLASS[size] ?? SELECT_UI.SELECT_MD;
  const chevronClass = SELECT_CHEVRON_CLASS[size] ?? SELECT_UI.CHEVRON;

  return (
    <div className={`${wrapClass} ${className}`.trim()}>
      <select className={`${SELECT_UI.SELECT} ${sizeClass} ${selectClassName}`.trim()} disabled={disabled} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <FiChevronDown className={chevronClass} aria-hidden />
    </div>
  );
}
