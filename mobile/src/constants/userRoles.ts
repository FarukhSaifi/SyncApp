export const USER_ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin",
} as const);

export const USER_ROLE_LABELS = Object.freeze({
  [USER_ROLES.USER]: "User",
  [USER_ROLES.ADMIN]: "Admin",
} as const);

export interface UserRoleOption {
  value: string;
  label: string;
}

export const USER_ROLE_OPTIONS: UserRoleOption[] = [
  { value: USER_ROLES.USER, label: USER_ROLE_LABELS[USER_ROLES.USER] },
  { value: USER_ROLES.ADMIN, label: USER_ROLE_LABELS[USER_ROLES.ADMIN] },
];

export const USER_VERIFIED_FILTER = Object.freeze({
  ALL: "all",
  VERIFIED: "verified",
  UNVERIFIED: "unverified",
} as const);
