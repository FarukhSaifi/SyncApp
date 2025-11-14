/**
 * User Roles Constants
 * Centralized user role definitions for the entire application
 */

export const USER_ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
});

export const USER_ROLE_LABELS = Object.freeze({
  [USER_ROLES.USER]: "User",
  [USER_ROLES.ADMIN]: "Admin",
});

export const USER_ROLE_OPTIONS = [
  { value: USER_ROLES.USER, label: USER_ROLE_LABELS[USER_ROLES.USER] },
  { value: USER_ROLES.ADMIN, label: USER_ROLE_LABELS[USER_ROLES.ADMIN] },
];

export const VALID_USER_ROLES = Object.values(USER_ROLES);
