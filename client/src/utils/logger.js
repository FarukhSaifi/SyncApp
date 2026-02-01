/**
 * Dev-only logger. No-op in production to avoid console noise and slight perf cost.
 * Use for debug logs that should not ship to production.
 */
const isDev = () => import.meta.env.DEV || import.meta.env.MODE === "development";

export const devLog = (...args) => {
  if (isDev()) {
    console.log(...args);
  }
};

export const devWarn = (...args) => {
  if (isDev()) {
    console.warn(...args);
  }
};

export const devError = (...args) => {
  if (isDev()) {
    console.error(...args);
  }
};
