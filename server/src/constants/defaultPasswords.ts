/**
 * Default password helpers — values come from env, never hardcoded secrets.
 */

export const DEFAULT_PASSWORDS = Object.freeze({
  ENV_TEMP_PASSWORD: "DEFAULT_TEMP_PASSWORD",
  /** Users should change the temporary password immediately on first login. */
  PASSWORD_CHANGE_REQUIRED: true,
} as const);

/**
 * Temporary password for admin-created users when none is supplied.
 * Set `DEFAULT_TEMP_PASSWORD` in server/.env.dev or server/.env.prod.
 */
export function resolveTempPassword(): string {
  const password = process.env[DEFAULT_PASSWORDS.ENV_TEMP_PASSWORD]?.trim();
  if (!password) {
    throw new Error(`Missing ${DEFAULT_PASSWORDS.ENV_TEMP_PASSWORD}. Set it in server/.env.dev or server/.env.prod.`);
  }
  return password;
}
