/**
 * Re-exports of `typeof`-derived unions that must stay defined next to their
 * constant maps (avoids circular imports). Prefer importing these from `@types`.
 */
export type { OptimizationTarget, PlatformSlug } from "../constants/platforms";
