/**
 * Storage and file upload types.
 */
export interface PresignedUploadResponse {
  presignedUrl: string;
  publicUrl: string;
  key: string;
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
