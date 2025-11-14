/**
 * User Roles Constants
 * Centralized user role definitions for the entire server application
 */

const USER_ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
});

const USER_ROLE_LABELS = Object.freeze({
  [USER_ROLES.USER]: "User",
  [USER_ROLES.ADMIN]: "Admin",
});

const VALID_USER_ROLES = Object.values(USER_ROLES);

module.exports = {
  USER_ROLES,
  USER_ROLE_LABELS,
  VALID_USER_ROLES,
};

