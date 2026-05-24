import { Storage, type CreateWriteStreamOptions, type StorageOptions } from "@google-cloud/storage";
import { config } from "../config";
import { DEFAULT_VALUES } from "../constants/defaultValues";
import { HTTP_STATUS } from "../constants/httpStatus";
import { AppError } from "../middleware/errorHandler";

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

export async function uploadToGCS(fileBuffer: Buffer, originalname: string, mimetype: string): Promise<string> {
  const bucketName = config.gcpBucketName || process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new AppError(
      "Google Cloud Storage bucket name is not configured (GCS_BUCKET_NAME).",
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
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

    blobStream.on("finish", () => {
      const publicUrl = `${DEFAULT_VALUES.GCS_PUBLIC_URL_BASE}/${bucketName}/${filename}`;
      resolve(publicUrl);
    });

    blobStream.end(fileBuffer);
  });
}
