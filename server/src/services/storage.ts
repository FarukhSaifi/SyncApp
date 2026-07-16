import { DEFAULT_VALUES } from "../constants/defaultValues";
import { HTTP_STATUS } from "../constants/httpStatus";
import type { GCSCredentials } from "../types";

import { logger } from "../utils/logger";

import { Storage, type CreateWriteStreamOptions, type StorageOptions } from "@google-cloud/storage";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { AppError } from "../middleware/errorHandler";
import { loadGoogleServiceAccountCredentials } from "../utils/googleCredentials";

// ─── Module-level constants ──────────────────────────────────────────────────
// UPLOADS_DIR is fully resolved at module load time using only internal values.
// No user-supplied input ever reaches this path.
const UPLOADS_DIR = path.normalize(path.resolve(__dirname, "../../uploads"));

// Ensure the local uploads directory exists at module initialisation time
// so that no filesystem check is needed inside request handlers.
try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (err) {
  // Ignored or logged safely
}

// ─── GCS client singleton ────────────────────────────────────────────────────
let storageClient: Storage | null = null;

function getStorageClient(): Storage {
  if (storageClient) return storageClient;

  let project = config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT;

  const credentialsObj = loadGoogleServiceAccountCredentials() as GCSCredentials | null;
  if (credentialsObj?.project_id && !project) {
    project = credentialsObj.project_id;
  }

  const opts: StorageOptions = { projectId: project };

  if (credentialsObj) {
    opts.credentials = credentialsObj as StorageOptions["credentials"];
  }

  storageClient = new Storage(opts);
  return storageClient;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Resolves a file extension from the MIME type using a strict static mapping.
 * Never uses user-controlled input to construct paths.
 */
function getSafeExtension(mimetype: string): string {
  if (mimetype === "image/jpeg" || mimetype === "image/jpg") return "jpg";
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/gif") return "gif";
  if (mimetype === "image/webp") return "webp";
  if (mimetype === "image/svg+xml") return "svg";
  if (mimetype === "text/plain") return "txt";
  if (mimetype === "text/html") return "html";
  if (mimetype === "application/json") return "json";
  if (mimetype === "application/pdf") return "pdf";
  return DEFAULT_VALUES.DEFAULT_FILE_EXTENSION;
}

/**
 * Sanitize a caller-provided basename (e.g. cover-my-post-slug) for object keys.
 * Strips path segments and non-safe chars; never used as a raw path join alone.
 */
function sanitizeObjectBasename(originalname: string): string {
  const leaf = path.basename(originalname || "file").replace(/\.[^.]+$/, "");
  const cleaned = leaf
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
  return cleaned || "file";
}

/**
 * Build a unique storage object name that keeps post slug / title in the name.
 * Example: uploads/cover-how-to-optimize-react-1737123456789-42.png
 */
function buildStoredObjectName(originalname: string, mimetype: string, withPrefix: boolean): string {
  const mimeExt = getSafeExtension(mimetype);
  const ext =
    mimeExt !== DEFAULT_VALUES.DEFAULT_FILE_EXTENSION
      ? mimeExt
      : originalname
          .split(".")
          .pop()
          ?.replace(/[^a-zA-Z0-9]/g, "") || DEFAULT_VALUES.DEFAULT_FILE_EXTENSION;
  const base = sanitizeObjectBasename(originalname);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const name = `${base}-${unique}.${ext}`;
  return withPrefix ? `${DEFAULT_VALUES.GCS_UPLOAD_PREFIX}${name}` : name;
}

/**
 * Saves a buffer to the local uploads directory as a fallback when GCS is not
 * configured. Basename is sanitised; a unique suffix avoids overwrites.
 */
async function saveToLocalBackup(fileBuffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  const filename = buildStoredObjectName(originalname, mimetype, false);

  const filePath = path.normalize(path.join(UPLOADS_DIR, filename));
  if (!filePath.startsWith(UPLOADS_DIR)) {
    throw new AppError("Path traversal attempt detected", HTTP_STATUS.BAD_REQUEST);
  }

  await fs.promises.writeFile(filePath, fileBuffer);
  return filename;
}

/**
 * Uploads a file to Google Cloud Storage.
 * Falls back to local storage when GCS is not configured.
 */
async function uploadToGCSBucket(
  fileBuffer: Buffer,
  originalname: string,
  mimetype: string,
  bucketName: string,
): Promise<string> {
  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);

  const filename = buildStoredObjectName(originalname, mimetype, true);
  const blob = bucket.file(filename);

  return new Promise((resolve, reject) => {
    const writeOptions: CreateWriteStreamOptions = {
      resumable: false,
      contentType: mimetype,
      validation: false,
    };

    const blobStream = blob.createWriteStream(writeOptions);

    blobStream.on("error", (err: Error) => {
      reject(new AppError(`Upload failed: ${err.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR));
    });

    blobStream.on("finish", async () => {
      const isFirebase = bucketName.endsWith("firebasestorage.app");
      const publicUrl = isFirebase
        ? `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filename)}?alt=media`
        : `${DEFAULT_VALUES.GCS_PUBLIC_URL_BASE}/${bucketName}/${filename}`;

      try {
        await blob.makePublic();
        logger.debug(`Successfully set GCS/Firebase Storage object public: ${filename}`);
      } catch (err) {
        if (!isFirebase) {
          logger.warn(
            `Could not make GCS blob public (this is normal if Uniform Bucket-Level Access is ` +
              `enabled. Ensure 'allUsers' has 'Storage Object Viewer' role on your bucket): ` +
              `${(err as Error).message}`,
          );
        }
      }
      resolve(publicUrl);
    });

    blobStream.end(fileBuffer);
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────
/**
 * Uploads a file buffer to GCS, or falls back to local storage when the GCS
 * bucket is not configured.
 */
export async function uploadToGCS(
  fileBuffer: Buffer,
  originalname: string,
  mimetype: string,
  forceGCS = false,
): Promise<string> {
  const bucketName = config.gcpBucketName || process.env.GCS_BUCKET_NAME;

  if (!bucketName) {
    if (forceGCS) {
      throw new AppError(
        "Google Cloud Storage bucket name is not configured (GCS_BUCKET_NAME).",
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }
    const filename = await saveToLocalBackup(fileBuffer, mimetype, originalname);
    const backendUrl = process.env.API_URL || `http://localhost:${config.port ?? DEFAULT_VALUES.DEFAULT_PORT}`;
    return `${backendUrl.replace(/\/$/, "")}/uploads/${filename}`;
  }

  return uploadToGCSBucket(fileBuffer, originalname, mimetype, bucketName);
}
