import { DEFAULT_VALUES, ERROR_MESSAGES, HTTP_STATUS, extensionForMime } from "@constants";
import { AppError } from "@middleware/errorHandler";

const ALLOWED = new Set<string>(DEFAULT_VALUES["ALLOWED_UPLOAD_IMAGE_MIMES"]);

/**
 * Normalize MIME (e.g. image/jpg → image/jpeg) and reject non-allowlisted types.
 */
export function assertAllowedUploadImageMime(mimetype: string): string {
  const normalized =
    mimetype === DEFAULT_VALUES["MIME_IMAGE_JPG"] ? DEFAULT_VALUES["MIME_IMAGE_JPEG"] : mimetype;
  if (!ALLOWED.has(normalized) && !ALLOWED.has(mimetype)) {
    throw new AppError(ERROR_MESSAGES["UPLOAD_IMAGE_TYPE_INVALID"], HTTP_STATUS["BAD_REQUEST"]);
  }
  return normalized === DEFAULT_VALUES["MIME_IMAGE_JPG"]
    ? DEFAULT_VALUES["MIME_IMAGE_JPEG"]
    : normalized;
}

/**
 * Reject oversize decoded image buffers (standalone / cover / inline base64 path).
 */
export function assertStandaloneImageSize(byteLength: number): void {
  if (byteLength > DEFAULT_VALUES["MAX_STANDALONE_IMAGE_BYTES"]) {
    throw new AppError(ERROR_MESSAGES["UPLOAD_IMAGE_TOO_LARGE"], HTTP_STATUS["BAD_REQUEST"]);
  }
}

/** Safe file extension for an allowlisted image MIME. */
export function extensionForUploadImageMime(mimetype: string): string {
  const normalized = assertAllowedUploadImageMime(mimetype);
  return extensionForMime(normalized);
}
