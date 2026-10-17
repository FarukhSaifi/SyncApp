/**
 * Storage and file upload types.
 */
export interface PresignedUploadResponse {
  presignedUrl: string;
  publicUrl: string;
  key: string;
  /** Headers the client must send on the PUT (bound into the V4 signature). */
  headers: {
    "Content-Type": string;
    "x-goog-content-length-range": string;
  };
}

export interface PresignedUrlRequest {
  filename: string;
  contentType: string;
  size: number;
}

export interface GCSCredentials {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  projectId?: string;
  [key: string]: unknown;
}

export type GoogleServiceAccount = Record<string, unknown> & {
  project_id?: string;
};
