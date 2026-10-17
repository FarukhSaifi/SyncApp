/**
 * Default Values and Configuration Constants
 */

/** Canonical JPEG MIME (alias `image/jpg` normalizes to this). */
const MIME_IMAGE_JPEG = "image/jpeg";
const MIME_IMAGE_JPG = "image/jpg";
const MIME_IMAGE_PNG = "image/png";
const MIME_IMAGE_GIF = "image/gif";
const MIME_IMAGE_WEBP = "image/webp";

const GCS_PUBLIC_URL_BASE = "https://storage.googleapis.com";
const FIREBASE_STORAGE_URL_BASE = "https://firebasestorage.googleapis.com/v0/b";

export const DEFAULT_VALUES = Object.freeze({
  // Environment
  NODE_ENV_PRODUCTION: "production",
  NODE_ENV_DEVELOPMENT: "development",

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // JWT
  DEFAULT_JWT_EXPIRES_IN: "7d",

  // Rate Limiting
  DEFAULT_RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  DEFAULT_RATE_LIMIT_MAX_REQUESTS: 100,

  // CORS
  DEFAULT_CORS_ORIGIN: "http://localhost:3000",
  DEFAULT_DEV_ORIGINS: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://sync-app-client.vercel.app",
  ],

  // Body Parsing
  DEFAULT_BODY_LIMIT: "10mb",

  // Request Timeout
  DEFAULT_TIMEOUT_MS: 10000, // 10 seconds

  // Port
  DEFAULT_PORT: 9000,

  // Cache TTL (ms)
  CACHE_TTL_DEFAULT_MS: 300000, // 5 minutes
  CACHE_TTL_POSTS_LIST_MS: 120000, // 2 minutes
  /** Cache key segment for unauthenticated/public list requests */
  CACHE_KEY_PUBLIC: "public",

  // Google Cloud Storage
  GCS_UPLOAD_PREFIX: "uploads/",
  GCS_PUBLIC_URL_BASE,
  /** Legacy App Engine / Firebase default-bucket host suffix (without leading dot). */
  GCS_APPS_POT_BUCKET_SUFFIX: "appspot.com",
  FIREBASE_STORAGE_URL_BASE,
  FIREBASE_STORAGE_ALT_MEDIA_QUERY: "alt=media",
  GCS_UPLOAD_TYPE_MEDIA: "media",
  /** Header bound into V4 signed PUT URLs for exact Content-Length. */
  GOOG_CONTENT_LENGTH_RANGE_HEADER: "x-goog-content-length-range",
  STORAGE_DEFAULT_OBJECT_BASENAME: "file",
  PRESIGNED_URL_EXPIRY_MS: 15 * 60 * 1000, // 15 minutes
  STORAGE_SLUG_MAX_LENGTH: 35,
  STORAGE_SAFE_BASENAME_MAX_LENGTH: 100,
  /** Max decoded image bytes for server-side standalone upload (fits under DEFAULT_BODY_LIMIT with base64 overhead). */
  MAX_STANDALONE_IMAGE_BYTES: 6 * 1024 * 1024,
  /** Max bytes accepted for client direct-to-GCS presigned uploads. */
  MAX_PRESIGNED_UPLOAD_BYTES: 6 * 1024 * 1024,

  /** MIME aliases used when normalizing / comparing upload Content-Types. */
  MIME_IMAGE_JPEG,
  MIME_IMAGE_JPG,
  MIME_IMAGE_PNG,
  MIME_IMAGE_GIF,
  MIME_IMAGE_WEBP,

  /**
   * Allowed raster image MIME types for cover / presigned / standalone uploads.
   * SVG is intentionally excluded (XSS / scriptable content).
   */
  ALLOWED_UPLOAD_IMAGE_MIMES: [
    MIME_IMAGE_JPEG,
    MIME_IMAGE_JPG,
    MIME_IMAGE_PNG,
    MIME_IMAGE_GIF,
    MIME_IMAGE_WEBP,
  ] as const,

  // File MIME mapping to safe extensions (upload allowlist uses ALLOWED_UPLOAD_IMAGE_MIMES)
  MIME_TO_EXTENSION: {
    [MIME_IMAGE_JPEG]: "jpg",
    [MIME_IMAGE_JPG]: "jpg",
    [MIME_IMAGE_PNG]: "png",
    [MIME_IMAGE_GIF]: "gif",
    [MIME_IMAGE_WEBP]: "webp",
    "text/plain": "txt",
    "text/html": "html",
    "application/json": "json",
    "application/pdf": "pdf",
  },
  DEFAULT_FILE_EXTENSION: "bin",

  /** Visible suffix length when masking platform API keys for Settings UI. */
  CREDENTIAL_API_KEY_VISIBLE_CHARS: 4,
  CREDENTIAL_API_KEY_MASK_PREFIX: "••••",
} as const);

export type UploadImageMime = (typeof DEFAULT_VALUES)["ALLOWED_UPLOAD_IMAGE_MIMES"][number];

/** Safe file extension for a known MIME, else DEFAULT_FILE_EXTENSION. */
export function extensionForMime(mimetype: string): string {
  const map = DEFAULT_VALUES["MIME_TO_EXTENSION"];
  return map[mimetype as keyof typeof map] ?? DEFAULT_VALUES["DEFAULT_FILE_EXTENSION"];
}

/** Public Firebase Storage download URL (`?alt=media`). */
export function buildFirebaseStoragePublicUrl(bucketName: string, objectPath: string): string {
  return `${DEFAULT_VALUES["FIREBASE_STORAGE_URL_BASE"]}/${bucketName}/o/${encodeURIComponent(objectPath)}?${DEFAULT_VALUES["FIREBASE_STORAGE_ALT_MEDIA_QUERY"]}`;
}

/** Public GCS object URL (`https://storage.googleapis.com/<bucket>/<path>`). */
export function buildGcsPublicObjectUrl(bucketName: string, objectPath: string): string {
  return `${DEFAULT_VALUES["GCS_PUBLIC_URL_BASE"]}/${bucketName}/${objectPath}`;
}

/** GCS JSON API simple media upload URL. */
export function buildGcsJsonApiMediaUploadUrl(bucketName: string, objectName: string): string {
  return `${DEFAULT_VALUES["GCS_PUBLIC_URL_BASE"]}/upload/storage/v1/b/${bucketName}/o?uploadType=${DEFAULT_VALUES["GCS_UPLOAD_TYPE_MEDIA"]}&name=${encodeURIComponent(objectName)}`;
}
