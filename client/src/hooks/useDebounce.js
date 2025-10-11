import { useEffect, useState } from "react";

/**
 * Debounce hook - delays updating value until after delay
 * Useful for search inputs, filters, etc.
 * 
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;

