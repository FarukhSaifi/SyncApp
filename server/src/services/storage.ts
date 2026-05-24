import { Storage, type CreateWriteStreamOptions, type StorageOptions } from "@google-cloud/storage";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { DEFAULT_VALUES } from "../constants/defaultValues";
import { HTTP_STATUS } from "../constants/httpStatus";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

let storageClient: Storage | null = null;

interface GCSCredentials {
  project_id?: string;
  [key: string]: unknown;
}

function getStorageClient(): Storage {
  if (storageClient) return storageClient;

  let project = config.googleCloudProject || process.env.GOOGLE_CLOUD_PROJECT;

  let credentialsObj: GCSCredentials | null = null;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      credentialsObj = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON) as GCSCredentials;
      if (!project && credentialsObj?.project_id) {
        project = credentialsObj.project_id;
      }
    } catch {
      throw new AppError("Invalid GOOGLE_CREDENTIALS_JSON environment variable", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  const opts: StorageOptions = { projectId: project };

  if (credentialsObj) {
    opts.credentials = credentialsObj as StorageOptions["credentials"];
  } else if (config.googleApplicationCredentials) {
    opts.keyFilename = config.googleApplicationCredentials;
  }

  storageClient = new Storage(opts);
  return storageClient;
}

let mockUploadFn: typeof uploadToGCS | null = null;

export function setMockUpload(fn: typeof uploadToGCS | null) {
  mockUploadFn = fn;
}

export async function uploadToGCS(
  fileBuffer: Buffer,
  originalname: string,
  mimetype: string,
  forceGCS = false
): Promise<string> {
  if (mockUploadFn) {
    return mockUploadFn(fileBuffer, originalname, mimetype, forceGCS);
  }

  const bucketName = config.gcpBucketName || process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    if (forceGCS) {
      throw new AppError(
        "Google Cloud Storage bucket name is not configured (GCS_BUCKET_NAME).",
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }
    // Fallback to local storage when GCS bucket name is not configured
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = originalname.split(".").pop() || "tmp";
    const filename = `local-${uniquePrefix}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, fileBuffer);

    const backendUrl = process.env.API_URL || `http://localhost:${config.port || 9000}`;
    return `${backendUrl.replace(/\/$/, "")}/uploads/${filename}`;
  }

  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);

  const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = originalname.split(".").pop() || "tmp";
  const filename = `${DEFAULT_VALUES.GCS_UPLOAD_PREFIX}${uniquePrefix}.${ext}`;

  const blob = bucket.file(filename);

  return new Promise((resolve, reject) => {
    const writeOptions: CreateWriteStreamOptions = {
      resumable: false,
      contentType: mimetype,
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
            `Could not make GCS blob public (this is normal if Uniform Bucket-Level Access is enabled. Ensure 'allUsers' has 'Storage Object Viewer' role on your bucket): ${(err as Error).message}`,
          );
        }
      }
      resolve(publicUrl);
    });

    blobStream.end(fileBuffer);
  });
}
