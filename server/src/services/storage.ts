import fs from "fs";
import path from "path";

import { config } from "@config";
import {
  AI_CONFIG,
  DEFAULT_VALUES,
  ERROR_MESSAGES,
  HTTP,
  HTTP_STATUS,
  buildFirebaseStoragePublicUrl,
  buildGcsJsonApiMediaUploadUrl,
  buildGcsPublicObjectUrl,
  extensionForMime,
} from "@constants";
import { Storage, type StorageOptions } from "@google-cloud/storage";
import { AppError } from "@middleware/errorHandler";
import type { GCSCredentials, PresignedUploadResponse } from "@types";
import { loadGoogleServiceAccountCredentials, resolveGcsSigningServiceAccountEmail } from "@utils/googleCredentials";
import { logger } from "@utils/logger";
import { GoogleAuth, Impersonated } from "google-auth-library";

export type { PresignedUploadResponse };

// ─── Module-level constants ──────────────────────────────────────────────────
// UPLOADS_DIR is fully resolved at module load time using only internal values.
// No user-supplied input ever reaches this path.
const UPLOADS_DIR = path.normalize(path.resolve(__dirname, "../../uploads"));

// Ensure the local uploads directory exists at module initialisation time
// so that no filesystem check is needed inside request handlers.
try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch {
  // Directory may already exist or be unwritable in read-only deploy environments.
}

// ─── GCS client singleton ────────────────────────────────────────────────────
let storageClientPromise: Promise<Storage> | null = null;

function resolveStorageProjectId(credentialsObj: GCSCredentials | null): string | undefined {
  let project = config.googleCloudProject || process.env[AI_CONFIG["ENV_GOOGLE_CLOUD_PROJECT"]];
  if (!project && credentialsObj?.project_id) {
    project = credentialsObj.project_id;
  }
  return project || undefined;
}

/**
 * ADC `authorized_user` refresh tokens have no `client_email`, so
 * `file.getSignedUrl` fails with "Cannot sign data without client_email".
 * Impersonate the Vertex SA (Token Creator required) so IAM signBlob works.
 */
async function buildImpersonatedStorageClient(projectId: string | undefined): Promise<Storage> {
  const targetPrincipal = resolveGcsSigningServiceAccountEmail();
  const sourceAuth = new GoogleAuth({
    scopes: [AI_CONFIG["GCS_CLOUD_PLATFORM_SCOPE"]],
    projectId,
  });
  const sourceClient = await sourceAuth.getClient();
  const impersonated = new Impersonated({
    sourceClient,
    targetPrincipal,
    lifetime: AI_CONFIG["GCS_IMPERSONATION_LIFETIME_SEC"],
    delegates: [],
    targetScopes: [AI_CONFIG["GCS_CLOUD_PLATFORM_SCOPE"]],
  });

  // Pass a GoogleAuth wrapper (not Impersonated alone) so @google-cloud/storage
  // reuses the same google-auth-library instance for instanceof / signBlob.
  const authClient = new GoogleAuth({
    projectId,
    authClient: impersonated,
  });

  logger.info(`GCS signing via impersonated service account: ${targetPrincipal}`);
  return new Storage({
    projectId,
    authClient,
  });
}

async function buildStorageClient(): Promise<Storage> {
  const credentialsObj = loadGoogleServiceAccountCredentials() as GCSCredentials | null;
  const projectId = resolveStorageProjectId(credentialsObj);

  if (credentialsObj) {
    const opts: StorageOptions = {
      projectId,
      credentials: credentialsObj as StorageOptions["credentials"],
    };
    return new Storage(opts);
  }

  // Probe ADC / metadata for a signing identity (GCE default SA, external_account, etc.).
  const probe = new Storage({ projectId });
  try {
    const creds = await probe.authClient.getCredentials();
    const clientEmail = creds.client_email;
    if (typeof clientEmail === "string" && clientEmail.length > 0) {
      return probe;
    }
  } catch (err) {
    logger.debug(`GCS credential probe before impersonation: ${(err as Error).message}`);
  }

  try {
    return await buildImpersonatedStorageClient(projectId);
  } catch (err) {
    logger.error(`GCS signing impersonation failed: ${(err as Error).message}`);
    throw new AppError(ERROR_MESSAGES["GCS_SIGNING_IMPERSONATION_FAILED"], HTTP_STATUS["SERVICE_UNAVAILABLE"]);
  }
}

async function getStorageClient(): Promise<Storage> {
  if (!storageClientPromise) {
    storageClientPromise = buildStorageClient().catch((err: unknown) => {
      storageClientPromise = null;
      throw err;
    });
  }
  return storageClientPromise;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Sanitize a caller-provided basename (e.g. cover-my-post-slug) for object keys.
 * Strips path segments and non-safe chars; never used as a raw path join alone.
 */
function sanitizeObjectBasename(originalname: string): string {
  const fallback = DEFAULT_VALUES["STORAGE_DEFAULT_OBJECT_BASENAME"];
  const leaf = path.basename(originalname || fallback).replace(/\.[^.]+$/, "");
  const cleaned = leaf
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, DEFAULT_VALUES["STORAGE_SAFE_BASENAME_MAX_LENGTH"]);
  return cleaned || fallback;
}

/**
 * Build a unique storage object name that keeps post slug / title in the name.
 * Example: uploads/cover-how-to-optimize-react-1737123456789-42.png
 */
function buildStoredObjectName(originalname: string, mimetype: string, withPrefix: boolean): string {
  const mimeExt = extensionForMime(mimetype);
  const ext =
    mimeExt !== DEFAULT_VALUES["DEFAULT_FILE_EXTENSION"]
      ? mimeExt
      : originalname
          .split(".")
          .pop()
          ?.replace(/[^a-zA-Z0-9]/g, "") || DEFAULT_VALUES["DEFAULT_FILE_EXTENSION"];
  const base = sanitizeObjectBasename(originalname);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const name = `${base}-${unique}.${ext}`;
  return withPrefix ? `${DEFAULT_VALUES["GCS_UPLOAD_PREFIX"]}${name}` : name;
}

function isFirebaseGcsBucket(bucketName: string): boolean {
  return (
    bucketName.endsWith(AI_CONFIG["GCS_BUCKET_SUFFIX"]) ||
    bucketName.endsWith(DEFAULT_VALUES["GCS_APPS_POT_BUCKET_SUFFIX"])
  );
}

function publicObjectUrl(bucketName: string, objectPath: string): string {
  return isFirebaseGcsBucket(bucketName)
    ? buildFirebaseStoragePublicUrl(bucketName, objectPath)
    : buildGcsPublicObjectUrl(bucketName, objectPath);
}

/**
 * Saves a buffer to the local uploads directory as a fallback when GCS is not
 * configured. Basename is sanitised; a unique suffix avoids overwrites.
 */
async function saveToLocalBackup(fileBuffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  const filename = buildStoredObjectName(originalname, mimetype, false);

  const filePath = path.normalize(path.join(UPLOADS_DIR, filename));
  if (!filePath.startsWith(UPLOADS_DIR)) {
    throw new AppError(ERROR_MESSAGES["PATH_TRAVERSAL_DETECTED"], HTTP_STATUS["BAD_REQUEST"]);
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
  const filename = buildStoredObjectName(originalname, mimetype, true);

  try {
    const storage = await getStorageClient();
    const authClient = await storage.authClient.getClient();
    const tokenRes = await authClient.getAccessToken();
    const token = tokenRes?.token;

    if (token) {
      // Clean raw binary upload via Google Cloud Storage JSON API (preserves exact image bytes)
      const uploadUrl = buildGcsJsonApiMediaUploadUrl(bucketName, filename);
      const res = await fetch(uploadUrl, {
        method: HTTP["METHOD"]["POST"],
        headers: {
          [HTTP["HEADERS"]["AUTHORIZATION"]]: `${HTTP["AUTH_SCHEMES"]["BEARER"]} ${token}`,
          [HTTP["HEADERS"]["CONTENT_TYPE"]]: mimetype,
        },
        body: new Uint8Array(fileBuffer),
      });

      if (res.ok) {
        const publicUrl = publicObjectUrl(bucketName, filename);

        logger.info(`File successfully uploaded to GCS/Firebase Storage: ${filename}`);
        return publicUrl;
      }
      logger.warn(`GCS raw media upload failed with status ${res.status}`);
    }
  } catch (err) {
    logger.warn(`Raw GCS upload attempt failed: ${(err as Error).message}`);
  }

  // Fallback to standard @google-cloud/storage stream upload
  const storage = await getStorageClient();
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(filename);

  return new Promise((resolve, reject) => {
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: { contentType: mimetype },
      validation: false,
    });

    blobStream.on("error", (err: Error) => {
      reject(new AppError(ERROR_MESSAGES["UPLOAD_FAILED"](err.message), HTTP_STATUS["INTERNAL_SERVER_ERROR"]));
    });

    blobStream.on("finish", async () => {
      const publicUrl = publicObjectUrl(bucketName, filename);

      try {
        await blob.makePublic();
      } catch {
        // Ignored if uniform bucket-level access is enabled
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
  const bucketName = config.gcpBucketName || process.env[AI_CONFIG["ENV_GCS_BUCKET_NAME"]];

  if (!bucketName) {
    if (forceGCS) {
      throw new AppError(ERROR_MESSAGES["GCS_BUCKET_NOT_CONFIGURED"], HTTP_STATUS["SERVICE_UNAVAILABLE"]);
    }
    const filename = await saveToLocalBackup(fileBuffer, mimetype, originalname);
    const backendUrl = process.env.API_URL || `http://localhost:${config.port ?? DEFAULT_VALUES["DEFAULT_PORT"]}`;
    return `${backendUrl.replace(/\/$/, "")}/${DEFAULT_VALUES["GCS_UPLOAD_PREFIX"]}${filename}`;
  }

  return uploadToGCSBucket(fileBuffer, originalname, mimetype, bucketName);
}

/**
 * Generates a signed V4 PUT URL targeting Firebase/GCS bucket for direct client upload.
 * Valid for 15 minutes. Binds Content-Type and x-goog-content-length-range to the signed URL.
 */
export async function generatePresignedUploadUrl(
  filename: string,
  mimetype: string,
  sizeBytes: number,
  customBucket?: string,
): Promise<PresignedUploadResponse> {
  const bucketName = customBucket || config.gcpBucketName || process.env[AI_CONFIG["ENV_GCS_BUCKET_NAME"]];
  if (!bucketName) {
    throw new AppError(ERROR_MESSAGES["GCS_BUCKET_NOT_CONFIGURED"], HTTP_STATUS["SERVICE_UNAVAILABLE"]);
  }

  if (
    !(DEFAULT_VALUES["ALLOWED_UPLOAD_IMAGE_MIMES"] as readonly string[]).includes(mimetype) &&
    mimetype !== DEFAULT_VALUES["MIME_IMAGE_JPG"]
  ) {
    throw new AppError(ERROR_MESSAGES["UPLOAD_IMAGE_TYPE_INVALID"], HTTP_STATUS["BAD_REQUEST"]);
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > DEFAULT_VALUES["MAX_PRESIGNED_UPLOAD_BYTES"]) {
    throw new AppError(ERROR_MESSAGES["UPLOAD_IMAGE_TOO_LARGE"], HTTP_STATUS["BAD_REQUEST"]);
  }

  const normalizedMime = mimetype === DEFAULT_VALUES["MIME_IMAGE_JPG"] ? DEFAULT_VALUES["MIME_IMAGE_JPEG"] : mimetype;
  const contentLengthRangeHeader = `${sizeBytes},${sizeBytes}`;
  const contentLengthRangeKey = DEFAULT_VALUES["GOOG_CONTENT_LENGTH_RANGE_HEADER"];

  try {
    const storage = await getStorageClient();
    const bucket = storage.bucket(bucketName);
    const objectKey = buildStoredObjectName(filename, normalizedMime, true);
    const file = bucket.file(objectKey);

    const [presignedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + DEFAULT_VALUES["PRESIGNED_URL_EXPIRY_MS"],
      contentType: normalizedMime,
      // GCS validates this header against the signed canonical request.
      extensionHeaders: {
        [contentLengthRangeKey]: contentLengthRangeHeader,
      },
    });

    const publicUrl = publicObjectUrl(bucketName, objectKey);

    logger.info(`Generated presigned upload URL for: ${objectKey}`);
    return {
      presignedUrl,
      publicUrl,
      key: objectKey,
      headers: {
        [HTTP["HEADERS"]["CONTENT_TYPE"]]: normalizedMime,
        [contentLengthRangeKey]: contentLengthRangeHeader,
      },
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error(`Presigned URL generation failed: ${(err as Error).message}`);
    throw new AppError(ERROR_MESSAGES["GCS_SIGNED_URL_FAILED"], HTTP_STATUS["INTERNAL_SERVER_ERROR"]);
  }
}
