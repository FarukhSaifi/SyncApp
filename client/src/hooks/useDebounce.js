import { useEffect, useState } from "react";

/**
 * Returns a debounced value that updates after `delay` ms of no changes.
 * Use for search inputs to avoid firing API on every keystroke.
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in ms (default 300)
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
