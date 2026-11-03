/**
 * Vitest 5 uses Assertion<R, T> (two type params). @testing-library/jest-dom's
 * built-in vitest types still augment Assertion<T>, so matchers never merge.
 * Re-declare against the Vitest 5 shape.
 */
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any -- matcher augmentation for Vitest 5
  interface Assertion<R = any, T = any> extends TestingLibraryMatchers<any, R> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any -- matcher augmentation for Vitest 5
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}
