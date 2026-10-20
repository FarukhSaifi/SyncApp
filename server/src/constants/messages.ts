/**
 * Messages Constants
 * Centralized error messages and success messages for the entire server application
 */

// Error Messages
export const ERROR_MESSAGES = {
  // Auth
  ACCESS_TOKEN_REQUIRED: "Access token required",
  INVALID_OR_EXPIRED_TOKEN: "Invalid or expired token",
  ACCESS_DENIED: "Access denied",
  ADMIN_ACCESS_REQUIRED: "Access denied. Admin privileges required.",
  USER_NOT_FOUND: "User not found",
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
  // User Management
  FAILED_TO_VERIFY_ADMIN: "Failed to verify admin access",
  INVALID_ROLE: "Invalid role. Must be 'user' or 'admin'",
  USER_ALREADY_EXISTS: "User with this email or username already exists",
  INVALID_FIELD: (path: string, value: unknown) => `Invalid value for field '${path}': ${value}`,
  FIELD_ALREADY_EXISTS: "already exists",
  // Posts
  ACCESS_DENIED_POST: "Access denied",
  POST_NOT_FOUND: "Post not found",
  DATABASE_UNAVAILABLE: "Database unavailable. Check MONGODB_URI and Atlas network access.",
  // General
  OPERATION_FAILED: "Operation failed",
  REQUEST_FAILED: "Request failed",
  // MDX
  FAILED_TO_GENERATE_MDX: "Failed to generate MDX",
  // Publishing
  INVALID_MEDIUM_API_KEY: "Invalid Medium API key",
  INVALID_DEVTO_API_KEY: "Invalid DEV.to API key",
  INVALID_WORDPRESS_API_KEY: "Invalid WordPress API key",
  INVALID_LINKEDIN_TOKEN: "Invalid or expired LinkedIn access token. Reconnect LinkedIn in Settings.",
  LINKEDIN_NOT_CONFIGURED:
    "LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_REDIRECT_URI.",
  LINKEDIN_OAUTH_STATE_INVALID: "LinkedIn OAuth state is invalid or expired. Try connecting again.",
  LINKEDIN_OAUTH_DENIED: "LinkedIn authorization was denied or cancelled.",
  LINKEDIN_PERSON_URN_MISSING: "Could not resolve LinkedIn member identity. Reconnect LinkedIn in Settings.",
  LINKEDIN_SUMMARY_REQUIRED:
    "No LinkedIn summary on this post. Generate one from the LinkedIn panel (or a draft with LinkedIn checked), then publish.",
  LINKEDIN_UNPUBLISH_UNSUPPORTED:
    "LinkedIn posts cannot be unpublished from SyncApp. Delete the post from LinkedIn if needed.",
  FAILED_TO_PUBLISH_ANY_PLATFORM: "Failed to publish to any platform",
  // Encryption
  FAILED_TO_ENCRYPT: "Failed to encrypt data",
  FAILED_TO_DECRYPT: "Failed to decrypt data",
  CREDENTIAL_DECRYPT_FAILED:
    "Could not decrypt stored API key. Confirm ENCRYPTION_KEY matches when the key was saved, then re-enter the API key in Settings.",
  CRON_SECRET_REQUIRED_PRODUCTION: "CRON_SECRET is required in production",
  CRON_AUTH_INVALID: "Invalid or missing CRON_SECRET",
  // Profile
  FAILED_TO_GET_PROFILE: "Failed to get profile",
  FAILED_TO_UPDATE_PROFILE: "Failed to update profile",
  FAILED_TO_CHANGE_PASSWORD: "Failed to change password",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
  // Registration/Login
  REGISTRATION_FAILED: "Registration failed",
  LOGIN_FAILED: "Login failed",
  // Publishing
  POST_ID_REQUIRED: "Post ID is required",
  NO_ACTIVE_CREDENTIALS: "No active platform credentials found. Please configure at least one platform.",
  PLATFORM_NOT_SUPPORTED: "Platform not supported",
  PUBLISHING_FAILED: "Publishing failed",
  INVALID_PLATFORM: "Invalid platform",
  INVALID_PLATFORM_PARAM: (platform: string) => `Invalid platform: ${platform}`,
  // Credentials
  CREDENTIALS_NOT_FOUND_PLATFORM: "Credentials not found for this platform",
  CREDENTIAL_NOT_FOUND: "Credential not found",
  API_KEY_REQUIRED: "API key is required",
  WORDPRESS_SITE_URL_REQUIRED: "WordPress site URL is required",
  WORDPRESS_SITE_URL_NOT_CONFIGURED: "WordPress site URL not configured",
  // Rate Limiting
  TOO_MANY_REQUESTS: "Too many requests from this IP, please try again later.",
  // General Server
  ROUTE_NOT_FOUND: "Route not found",
  RESOURCE_NOT_FOUND: "Resource not found",
  INTERNAL_SERVER_ERROR: "Internal server error",
  EXTERNAL_SERVICE_UNAVAILABLE: "External service unavailable",
  VALIDATION_FAILED_ERROR: "Validation failed",
  QUERY_VALIDATION_FAILED_ERROR: "Query validation failed",
  UNAUTHORIZED_ACCESS: "Unauthorized",
  // Console logging
  REGISTRATION_ERROR_LOG: "Registration error:",
  LOGIN_ERROR_LOG: "Login error:",
  GET_PROFILE_ERROR_LOG: "Get profile error:",
  UPDATE_PROFILE_ERROR_LOG: "Update profile error:",
  CHANGE_PASSWORD_ERROR_LOG: "Change password error:",
  MDX_GENERATION_ERROR_LOG: "Error generating MDX:",
  DECRYPTION_ERROR_LOG: "Failed to decrypt API key:",
  ADMIN_CHECK_ERROR_LOG: "Admin check error",
  ENCRYPTION_ERROR_LOG: "Encryption error",
  DECRYPTION_ERROR_LOG_GENERIC: "Decryption error",
  // AI (Vertex AI primary / Google AI Studio fallback)
  GEMINI_API_KEY_URL: "https://aistudio.google.com/apikey",
  AI_PROVIDER_REQUIRED:
    "AI is not configured. Prefer Vertex AI: set GOOGLE_CLOUD_PROJECT=syncapp-ai, GOOGLE_CLOUD_LOCATION (e.g. us-central1), and service-account credentials (GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS). Studio fallback: set GEMINI_API_KEY. See docs/AI_SETUP.md.",
  VERTEX_AI_CONFIG_REQUIRED:
    "Vertex AI requires GOOGLE_CLOUD_PROJECT and credentials (GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS — service account JSON, or Application Default Credentials). Enable aiplatform.googleapis.com on project syncapp-ai. See docs/AI_SETUP.md.",
  VERTEX_AI_CREDENTIALS_INVALID:
    "Google service-account JSON is missing client_email or private_key. Fix GOOGLE_CREDENTIALS_JSON / GOOGLE_APPLICATION_CREDENTIALS (or use an authorized_user ADC file when SA keys are blocked by org policy).",
  VERTEX_AI_AUTH_FAILED:
    "Vertex AI authentication failed. Check credentials (SA JSON or ADC), IAM roles (Vertex AI User), and that the Vertex AI API is enabled on syncapp-ai.",
  GEMINI_API_KEY_REQUIRED:
    "GEMINI_API_KEY is required for Google AI Studio fallback. Prefer Vertex AI (GOOGLE_CLOUD_PROJECT + SA credentials). Local: server/.env.dev. Production: Vercel → sync-app-server → Environment Variables, then Redeploy.",
  GEMINI_API_KEY_INVALID:
    "GEMINI_API_KEY is invalid or revoked. Prefer migrating to Vertex AI on project syncapp-ai, or create a new Studio key and update env, then restart / Redeploy.",
  AI_MODEL_NOT_FOUND:
    "The selected AI model was not found or is not available in this region/project. Try gemini-3.8-flash, or set GOOGLE_CLOUD_LOCATION to a region that hosts the model.",
  AI_DRAFT_FAILED: "Failed to generate draft",
  AI_PARSE_FAILED: "AI returned invalid JSON. Please try again with a different model or keyword.",
  AI_KEYWORD_RESEARCH_PARSE_FAILED: "Unable to parse keyword research from AI response",
  AI_TRENDING_PARSE_FAILED: "Unable to parse topics or keywords from AI response",
  AI_KEYWORD_REQUIRED: "Keyword or topic is required",
  AI_SEED_REQUIRED: "Seed topic is required for keyword research",
  AI_SEED_TOO_SHORT: "Seed topic is too short",
  AI_SEED_TOO_LONG: "Seed topic is too long",
  AI_INVALID_MODEL: "The selected AI model is not allowed. Choose a model from the list.",
  AI_INVALID_OPTIMIZATION_TARGETS: "Invalid optimization targets. Allowed: devto, linkedin, google.",
  AI_EMPTY_RESPONSE: "Empty response from AI",
  AI_IMAGE_FAILED: "Failed to generate featured image",
  AI_IMAGE_UNAVAILABLE_DETAIL:
    " — Gemini image models are temporarily unavailable or rate limited. Ensure Vertex AI is configured on syncapp-ai (not Imagen). Please retry shortly.",
  AI_CONFIG_VALIDATION_REQUIRED:
    "AI configuration required: set Vertex AI (GOOGLE_CLOUD_PROJECT + GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS) or GEMINI_API_KEY (Studio fallback). See docs/AI_SETUP.md.",
  AI_TRENDING_REQUIRES_PROVIDER: " Trending topics require Vertex AI or Studio access.",
  AI_TRENDING_FETCH_FAILED:
    "Trending topics and search keywords could not be fetched right now. Please retry in a few moments.",
  AI_KEYWORD_RESEARCH_REQUIRES_PROVIDER: " Keyword research requires Vertex AI or Studio access.",
  AI_KEYWORD_RESEARCH_FAILED:
    "Keyword research could not be completed right now. Please retry in a few moments.",
  AI_RATE_LIMITED: "AI rate limit reached for this model. Wait a minute, or use Gemini 3.8 Flash / Flash-Lite.",
  /** Studio prepaid credits depleted (HTTP 402). Do not top up Studio — use Vertex AI instead. */
  AI_CREDITS_DEPLETED:
    "Google AI Studio prepayment credits are depleted. Do not top up AI Studio billing — configure Vertex AI on GCP project syncapp-ai (GOOGLE_CLOUD_PROJECT + service-account credentials). See docs/AI_SETUP.md.",
  AI_UNAVAILABLE: "The AI model is temporarily overloaded. Try again in a minute, or pick Gemini 3.8 Flash.",
  AI_STARTUP_NO_PROVIDER:
    "AI: not configured — set Vertex AI (GOOGLE_CLOUD_PROJECT + SA credentials) or GEMINI_API_KEY. See docs/AI_SETUP.md",
  AI_STARTUP_VERTEX_PREFIX: "AI: Vertex AI configured (project=",
  AI_STARTUP_VERTEX_MID: ", location=",
  AI_STARTUP_VERTEX_SUFFIX: ") — text and image generation use Vertex Gemini models",
  AI_STARTUP_STUDIO_PREFIX: "AI: Google AI Studio key detected (",
  AI_STARTUP_STUDIO_SUFFIX: ") — text and image generation use GEMINI_API_KEY (prefer Vertex when SA creds are set)",
  AI_STARTUP_KEY_SET_HINT: "(set)",
  AI_EDIT_FAILED: "Failed to perform AI edit",
  AI_EDIT_CONTEXT_REQUIRED: "Context text is required for AI edit actions",
  AI_LINKEDIN_SUMMARY_FAILED: "Failed to generate LinkedIn summary",
  AI_LINKEDIN_SUMMARY_CONTEXT_REQUIRED:
    "Add a title and article content in the editor first, then generate a LinkedIn summary.",
  AI_TRENDING_TOPICS_FAILED: "Failed to fetch real-time trending topics",
  AI_DEVTO_TAGS_FAILED: "Failed to fetch high-reach tags from DEV.to",
  AI_DEVTO_TAGS_NOT_ARRAY: "DEV.to tags response was not an array",
  AI_DEVTO_TAGS_TOO_FEW: "DEV.to returned too few usable tags",
  AI_DEVTO_TAGS_HTTP: (status: number) => `DEV.to tags HTTP ${status}`,
  // Analytics
  ANALYTICS_DEVTO_CREDENTIALS_MISSING:
    "Connect DEV.to in Settings to sync engagement stats (views, reactions, comments).",
  ANALYTICS_DEVTO_SYNC_FAILED: "Failed to sync DEV.to engagement stats",
  ANALYTICS_DEVTO_INVALID_KEY: "DEV.to API key is invalid or expired — reconnect in Settings",
  ANALYTICS_GA4_NOT_CONFIGURED:
    "GOOGLE_ANALYTICS_PROPERTY_ID is not set. Add the numeric GA4 property id and grant the service account Viewer access — see docs/GA4_SETUP.md.",
  ANALYTICS_GA4_CREDENTIALS_MISSING:
    "No Google credentials available for GA4 Data API. Set GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS.",
  ANALYTICS_GA4_FETCH_FAILED: "Failed to fetch Google Analytics 4 report data",
  // Upload
  UPLOAD_NO_FILE: "No file provided",
  UPLOAD_IMAGE_DATA_URL_REQUIRED: "Image data URL is required",
  UPLOAD_IMAGE_TOO_LARGE: "Image exceeds the maximum allowed size",
  UPLOAD_IMAGE_TYPE_INVALID: "Only image uploads are allowed",
  UPLOAD_IMAGE_FAILED: "Failed to upload image",
  UPLOAD_FILENAME_REQUIRED: "Filename is required",
  UPLOAD_CONTENT_TYPE_REQUIRED: "Content type is required",
  UPLOAD_SIZE_MUST_BE_POSITIVE: "Size must be greater than 0",
  UPLOAD_FAILED: (detail: string) => `Upload failed: ${detail}`,
  PATH_TRAVERSAL_DETECTED: "Path traversal attempt detected",
  GCS_BUCKET_NOT_CONFIGURED: "Google Cloud Storage bucket name is not configured (GCS_BUCKET_NAME).",
  GCS_SIGNED_URL_FAILED:
    "Failed to generate a signed upload URL for Google Cloud Storage. Ensure GCS credentials can sign (service-account JSON, or ADC with Service Account Token Creator on the signing SA).",
  GCS_SIGNING_IMPERSONATION_FAILED:
    "Cannot sign GCS upload URLs with user Application Default Credentials. Grant your user the Service Account Token Creator role on syncapp-vertex-ai@syncapp-ai.iam.gserviceaccount.com (or set GOOGLE_CREDENTIALS_JSON to a service-account key).",
  LINKEDIN_API_KEY_PASTE_UNSUPPORTED:
    "Connect LinkedIn via OAuth in Settings (API key paste is not supported for LinkedIn).",
  VALID_URL_REQUIRED: "Valid URL is required",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: "Login successful",
  REGISTRATION_SUCCESS: "User registered successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",
  // User Management
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  // Posts
  POST_CREATED: "Post created successfully",
  POST_UPDATED: "Post updated successfully",
  POST_DELETED: "Post deleted successfully",
  // Credentials
  CREDENTIALS_SAVED: "Credentials saved successfully",
  CREDENTIALS_DELETED: "Credentials deleted successfully",
  // Users
  USER_CREATED: "User created successfully",
  // Publishing success
  PUBLISHED_TO_PLATFORM: (name: string) => `Post published to ${name} successfully`,
  UPDATED_ON_PLATFORM: (name: string) => `Post updated on ${name} successfully`,
  ALREADY_PUBLISHED_ON_PLATFORM: (name: string) => `Post is already published on ${name}`,
  PUBLISHED_TO_PLATFORMS: (platforms: string[]) => `Published to ${platforms.join(", ")} with some errors`,
  PUBLISHED_TO_ALL: (platforms: string[]) => `Post published to all platforms successfully (${platforms.join(", ")})`,
  FAILED_TO_PUBLISH_ALL: "Failed to publish to any platform",
  UNPUBLISHED_FROM_PLATFORM: (name: string) => `Post unpublished from ${name}`,
  ANALYTICS_DEVTO_SYNCED: (count: number) =>
    count === 1 ? "Synced engagement for 1 DEV.to article" : `Synced engagement for ${count} DEV.to articles`,
} as const;
