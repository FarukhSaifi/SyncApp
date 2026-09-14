import { z } from "zod";

export const presignedUrlRequestSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  size: z.number().positive("Size must be greater than 0").max(50 * 1024 * 1024, "File exceeds 50MB limit"),
  contentType: z.string().min(1, "Content type is required").regex(/^image\//, "Only image uploads are allowed"),
});

export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;

export const upsertCredentialSchema = z.object({
  api_key: z.string().min(1, "API key is required"),
  site_url: z.string().url("Valid URL is required").optional().or(z.literal("")),
  platform_config: z.record(z.string(), z.unknown()).optional(),
});

export type UpsertCredentialRequest = z.infer<typeof upsertCredentialSchema>;
