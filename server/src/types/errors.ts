/**
 * Error shapes and database driver error interfaces.
 */
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

export interface MongoValidationError extends Error {
  errors: Record<string, { message: string }>;
}

export interface MongoCastError extends Error {
  path: string;
  value: unknown;
}

export interface MongoDuplicateKeyError extends Error {
  code: number;
  keyPattern: Record<string, unknown>;
}

export interface AxiosErrorLike extends Error {
  isAxiosError: boolean;
  response?: {
    status: number;
    data?: { message?: string; error?: string };
  };
  request?: unknown;
}
