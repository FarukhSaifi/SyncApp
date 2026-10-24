import { AI_CONFIG, DEFAULT_VALUES, ERROR_MESSAGES } from "@constants";
import { z } from "zod";

export const presignedUrlRequestSchema = z.object({
  filename: z.string().min(1, ERROR_MESSAGES["UPLOAD_FILENAME_REQUIRED"]),
  size: z
    .number()
    .positive(ERROR_MESSAGES["UPLOAD_SIZE_MUST_BE_POSITIVE"])
    .max(DEFAULT_VALUES["MAX_PRESIGNED_UPLOAD_BYTES"], ERROR_MESSAGES["UPLOAD_IMAGE_TOO_LARGE"]),
  contentType: z
    .string()
    .min(1, ERROR_MESSAGES["UPLOAD_CONTENT_TYPE_REQUIRED"])
    .refine(
      (value) => (DEFAULT_VALUES["ALLOWED_UPLOAD_IMAGE_MIMES"] as readonly string[]).includes(value),
      ERROR_MESSAGES["UPLOAD_IMAGE_TYPE_INVALID"],
    ),
});

export const upsertCredentialSchema = z.object({
  api_key: z.string().min(1, ERROR_MESSAGES["API_KEY_REQUIRED"]),
  site_url: z.string().url(ERROR_MESSAGES["VALID_URL_REQUIRED"]).optional().or(z.literal("")),
  platform_config: z.record(z.string(), z.unknown()).optional(),
});

export const keywordResearchRequestSchema = z.object({
  seed: z
    .string()
    .trim()
    .min(AI_CONFIG["SEED_MIN_LEN"], ERROR_MESSAGES["AI_SEED_TOO_SHORT"])
    .max(AI_CONFIG["SEED_MAX_LEN"], ERROR_MESSAGES["AI_SEED_TOO_LONG"]),
});

/** Request body shapes live in `@types` (storage / credentials / ai). */
