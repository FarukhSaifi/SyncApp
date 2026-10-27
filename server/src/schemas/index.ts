import { AI_CONFIG, DEFAULT_VALUES, ERROR_MESSAGES, SEO_IMPROVE_LIMITS } from "@constants";
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

const seoImproveFieldSchema = z.enum(["title", "meta_description", "tags", "canonical_url", "content"]);

const seoImproveApplySchema = z.enum(["replace", "append"]);

export const improveSeoRequestSchema = z.object({
  targets: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        field: seoImproveFieldSchema,
        issue: z.string().trim().min(1).max(SEO_IMPROVE_LIMITS.ISSUE_MAX),
        currentValue: z.string().max(SEO_IMPROVE_LIMITS.CURRENT_VALUE_MAX).default(""),
        applyMode: seoImproveApplySchema.default("replace"),
        surroundingContext: z.string().max(SEO_IMPROVE_LIMITS.SURROUNDING_CHARS).optional(),
      }),
    )
    .min(1, ERROR_MESSAGES["AI_SEO_IMPROVE_TARGETS_REQUIRED"])
    .max(SEO_IMPROVE_LIMITS.MAX_TARGETS),
  model: z.string().trim().max(80).optional(),
  primaryKeyword: z.string().trim().max(SEO_IMPROVE_LIMITS.PRIMARY_KEYWORD_MAX).optional(),
  title: z.string().trim().max(SEO_IMPROVE_LIMITS.TITLE_CONTEXT_MAX).optional(),
  platforms: z.array(z.string().trim().max(40)).max(6).optional(),
});

/** Request body shapes live in `@types` (storage / credentials / ai). */
