"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { DATA_TABLE, INPUT_SIZES } from "@constants";
import { useDebounce } from "@hooks/useDebounce";
import type { DebouncedSearchInputProps } from "@types";
import { FiSearch } from "react-icons/fi";

import Input from "@components/common/Input";

/**
 * Immediate typing in the input; notifies parent with a debounced value for API/filter work.
 */
export default function DebouncedSearchInput({
  value,
  onChange,
  debounceMs = DATA_TABLE.SEARCH_DEBOUNCE_MS,
  showSearchIcon = true,
  size = INPUT_SIZES.SM,
  leftIcon,
  ...inputProps
}: DebouncedSearchInputProps) {
  const [draft, setDraft] = useState<string>(value);
  const debouncedDraft = useDebounce(draft, debounceMs);
  const lastEmittedRef = useRef<string>(value);
  const skipInitialRef = useRef(true);

  // Latest parent handler without re-running the emit effect when identity changes.
  const emitChange = useEffectEvent((nextValue: string) => {
    onChange(nextValue);
  });

  useEffect(() => {
    if (value === lastEmittedRef.current) {
      return;
    }
    lastEmittedRef.current = value;
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (skipInitialRef.current) {
      skipInitialRef.current = false;
      return;
    }
    // Wait until debounce has caught up to the current draft (avoids stale emit after external reset).
    if (debouncedDraft !== draft) {
      return;
    }
    if (debouncedDraft === lastEmittedRef.current) {
      return;
    }
    lastEmittedRef.current = debouncedDraft;
    emitChange(debouncedDraft);
    // emitChange is from useEffectEvent: always latest onChange, stable identity — do not add to deps
    // (adding it is unnecessary; removing useEffectEvent would require a ref or risk stale handlers).
  }, [debouncedDraft, draft]);

  return (
    <Input
      {...inputProps}
      type="search"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
      }}
      size={size}
      leftIcon={
        showSearchIcon
          ? (leftIcon ?? <FiSearch className={DATA_TABLE.TOOLBAR_SEARCH_ICON_IN_INPUT} aria-hidden />)
          : leftIcon
      }
    />
  );
}
