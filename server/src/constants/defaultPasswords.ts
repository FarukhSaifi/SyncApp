/**
 * Default Password Constants
 * ⚠️ WARNING: These are temporary defaults for development only
 * NEVER use these in production!
 */

export const DEFAULT_PASSWORDS = Object.freeze({
  // Default temporary password for admin-created users
  TEMP_PASSWORD: "TempPassword123!",

  // Note: Users should change this immediately on first login
  PASSWORD_CHANGE_REQUIRED: true,
} as const);
