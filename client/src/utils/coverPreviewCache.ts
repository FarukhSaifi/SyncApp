import { COVER_UPLOAD } from "@constants/editor";

/** sessionStorage key for a cached base64 cover preview of a public URL. */
function coverPreviewSessionKey(url: string): string {
  return `${COVER_UPLOAD["PREVIEW_SESSION_PREFIX"]}${url}`;
}

export function readCoverPreviewCache(url: string): string | null {
  if (typeof window === "undefined" || !url) {
    return null;
  }
  return sessionStorage.getItem(coverPreviewSessionKey(url));
}

export function writeCoverPreviewCache(url: string, dataUrl: string): void {
  if (typeof window === "undefined" || !url || !dataUrl) {
    return;
  }
  sessionStorage.setItem(coverPreviewSessionKey(url), dataUrl);
}
