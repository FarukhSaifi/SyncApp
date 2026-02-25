/**
 * Save base64 cover image to disk and return public URL.
 * On serverless (e.g. Vercel) where fs may be read-only, returns the data URL as fallback.
 */

import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "covers");
const MAX_DATA_URL_LENGTH = 5 * 1024 * 1024; // 5MB

export interface UploadCoverResult {
  url: string;
  savedToDisk: boolean;
}

/**
 * Parse data URL (data:image/png;base64,...) and return { mime, buffer } or null
 */
function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return null;
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1].trim();
  const base64 = match[2];
  if (!base64) return null;
  try {
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > MAX_DATA_URL_LENGTH) return null;
    return { mime, buffer };
  } catch {
    return null;
  }
}

function getExtension(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "png";
}

/**
 * Save image from data URL to uploads/covers and return public URL.
 * If disk write fails (e.g. serverless), returns the data URL so client can still use it.
 */
export async function saveCoverImage(postId: string, imageDataUrl: string): Promise<UploadCoverResult> {
  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) {
    throw new Error("Invalid image data URL");
  }

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    return { url: imageDataUrl, savedToDisk: false };
  }

  const ext = getExtension(parsed.mime);
  const filename = `${postId}-${Date.now()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    await fs.writeFile(filePath, parsed.buffer);
    const url = `/api/uploads/covers/${filename}`;
    return { url, savedToDisk: true };
  } catch {
    return { url: imageDataUrl, savedToDisk: false };
  }
}
