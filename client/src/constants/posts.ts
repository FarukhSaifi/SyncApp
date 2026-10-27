/**
 * Posts list / cache defaults shared by hooks and dashboard views.
 */

/** Zeroed stats object when the posts API omits a stats payload. */
export const EMPTY_POSTS_STATS = Object.freeze({
  total: 0,
  published: 0,
  drafts: 0,
  scheduled: 0,
  withPlatforms: 0,
});
