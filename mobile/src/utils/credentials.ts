/**
 * Whether a credentials API row should show as connected / appear in publish targets.
 * Server always sets `configured` in sanitizeCredentialForClient; treat missing as not connected.
 */
export function isCredentialConnected(credential: {
  configured?: boolean;
  decrypt_failed?: boolean;
  is_active?: boolean;
} | null | undefined): boolean {
  if (!credential) {
    return false;
  }
  if (credential.is_active === false) {
    return false;
  }
  return credential.configured === true && !credential.decrypt_failed;
}
