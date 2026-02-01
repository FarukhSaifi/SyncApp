/**
 * Messages Constants
 * Centralized error messages and success messages for the entire server application
 */

// Error Messages
const ERROR_MESSAGES = Object.freeze({
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
  // Posts
  ACCESS_DENIED_POST: "Access denied",
  POST_NOT_FOUND: "Post not found",
  // General
  OPERATION_FAILED: "Operation failed",
  REQUEST_FAILED: "Request failed",
  // MDX
  FAILED_TO_GENERATE_MDX: "Failed to generate MDX",
  // Publishing
  INVALID_MEDIUM_API_KEY: "Invalid Medium API key",
  INVALID_DEVTO_API_KEY: "Invalid DEV.to API key",
  INVALID_WORDPRESS_API_KEY: "Invalid WordPress API key",
  FAILED_TO_PUBLISH_ANY_PLATFORM: "Failed to publish to any platform",
  // Encryption
  FAILED_TO_ENCRYPT: "Failed to encrypt data",
  FAILED_TO_DECRYPT: "Failed to decrypt data",
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
  // AI (Vertex AI)
  VERTEX_AI_PROJECT_MISSING:
    "Google Cloud project is not configured. Set GOOGLE_CLOUD_PROJECT and ensure GOOGLE_APPLICATION_CREDENTIALS (or gcloud auth application-default login) is set.",
  VERTEX_AI_API_DISABLED:
    "Vertex AI API is not enabled for this project. Enable it in Google Cloud Console, then retry in a few minutes.",
  VERTEX_AI_API_ENABLE_URL: "https://console.cloud.google.com/apis/library/aiplatform.googleapis.com",
  VERTEX_AI_BILLING_DISABLED:
    "Vertex AI requires billing to be enabled on your Google Cloud project. Enable billing, then retry in a few minutes.",
  VERTEX_AI_BILLING_ENABLE_URL: "https://console.cloud.google.com/billing/enable",
  VERTEX_AI_MODEL_NOT_FOUND:
    "The specified Gemini model was not found or your project does not have access. Set GOOGLE_AI_MODEL to a valid version (e.g. gemini-2.0-flash-001). See: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions",
  AI_OUTLINE_FAILED: "Failed to generate outline",
  AI_DRAFT_FAILED: "Failed to generate draft",
  AI_COMEDIAN_FAILED: "Failed to add humor and personality",
  AI_GENERATE_FAILED: "Failed to generate content",
});

// Success Messages
const SUCCESS_MESSAGES = Object.freeze({
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
  PUBLISHED_TO_PLATFORMS: (platforms) => `Published to ${platforms.join(", ")} with some errors`,
  PUBLISHED_TO_ALL: (platforms) => `Post published to all platforms successfully (${platforms.join(", ")})`,
  FAILED_TO_PUBLISH_ALL: "Failed to publish to any platform",
});

module.exports = {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
