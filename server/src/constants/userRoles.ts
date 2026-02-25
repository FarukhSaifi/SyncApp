/**
 * User Roles Constants
 * Centralized user role definitions for the entire server application
 */

export const USER_ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
} as const);

export const USER_ROLE_LABELS = Object.freeze({
  user: "User",
  admin: "Admin",
} as const);

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const VALID_USER_ROLES = Object.values(USER_ROLES) as UserRole[];
