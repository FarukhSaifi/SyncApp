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
});

module.exports = {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};

