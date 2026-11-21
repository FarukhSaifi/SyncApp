/**
 * WordPress / WordPress.com publish + sync policy (SSRF, auth, media caps).
 */

export const WORDPRESS = Object.freeze({
  PUBLIC_API_ORIGIN: "https://public-api.wordpress.com",
  PUBLIC_API_SITE_PREFIX: "/wp/v2/sites",
  WP_JSON_PREFIX: "/wp-json/wp/v2",
  WORDPRESS_COM_HOST_SUFFIX: ".wordpress.com",
  WORDPRESS_COM_HOST: "wordpress.com",
  PUBLIC_API_HOST: "public-api.wordpress.com",

  /** First create uses draft; explicit publish promotes to publish. */
  CREATE_STATUS: "draft",
  LIVE_STATUS: "publish",

  /**
   * Optimistic claim value written to platform_status.wordpress.post_id while a create
   * is in flight. Never treat as a real remote WordPress id (never PUT against it).
   */
  CREATING_POST_ID: "__creating__",

  LINK_METHODS: Object.freeze({
    CREATED: "created",
    MATCHED_SLUG: "matched_slug",
    MATCHED_TITLE: "matched_title",
    MANUAL: "manual",
  }),

  MEDIA: Object.freeze({
    MAX_BYTES: 5 * 1024 * 1024,
    ALLOWED_MIME_PREFIX: "image/",
    FETCH_TIMEOUT_MS: 15_000,
    MAX_REDIRECTS: 3,
  }),

  TEST_CONNECTION: Object.freeze({
    WINDOW_MS: 60_000,
    MAX_PER_WINDOW: 10,
  }),

  SEARCH: Object.freeze({
    MAX_CANDIDATES: 10,
  }),

  /** Hostnames that must never be used as outbound fetch targets. */
  BLOCKED_HOSTNAMES: Object.freeze([
    "localhost",
    "metadata.google.internal",
    "metadata",
    "instance-data",
    "kubernetes.default",
    "kubernetes.default.svc",
    "kubernetes.default.svc.cluster.local",
  ]),
});

export type WordpressLinkMethod =
  (typeof WORDPRESS.LINK_METHODS)[keyof typeof WORDPRESS.LINK_METHODS];
