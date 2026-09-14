import crypto from "crypto";

import { config } from "../config";
import { ERROR_MESSAGES } from "../constants/messages";
import { logger } from "./logger";

function getKeyBuffer(): Buffer {
  const hex = config.encryption.key;
  if (/^[0-9a-fA-F]{64}$/.test(hex)) {
    return Buffer.from(hex, "hex");
  }
  return crypto.createHash("sha256").update(hex).digest();
}

/**
 * Encrypt a credential using authenticated AES-256-GCM.
 * @param plaintext - The raw credential string
 * @returns Packed string in format: `${ivHex}:${authTagHex}:${ciphertextHex}`
 */
export function encryptCredential(plaintext: string): string {
  try {
    const key = getKeyBuffer();
    const iv = crypto.randomBytes(12); // 12-byte IV standard for AES-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");
    const ivHex = iv.toString("hex");

    return `${ivHex}:${authTag}:${ciphertext}`;
  } catch (error) {
    logger.error(ERROR_MESSAGES.ENCRYPTION_ERROR_LOG, error as Error);
    throw new Error(ERROR_MESSAGES.FAILED_TO_ENCRYPT);
  }
}

/**
 * Decrypt a credential using authenticated AES-256-GCM.
 * Backwards-compatible with legacy unauthenticated CBC format.
 * @param packedPayload - The packed string or legacy hex string
 * @returns The decrypted credential plaintext
 */
export function decryptCredential(packedPayload: string): string {
  try {
    if (!packedPayload) return "";

    const parts = packedPayload.split(":");
    if (parts.length === 3) {
      const [ivHex, authTagHex, ciphertextHex] = parts;
      const key = getKeyBuffer();
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");

      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    }

    // Fallback: Attempt legacy AES-256-CBC decryption
    const key = getKeyBuffer();
    const iv = crypto.createHash("md5").update(config.encryption.key).digest();
    const legacyDecipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let legacyDecrypted = legacyDecipher.update(packedPayload, "hex", "utf8");
    legacyDecrypted += legacyDecipher.final("utf8");
    return legacyDecrypted;
  } catch (error) {
    logger.error(ERROR_MESSAGES.DECRYPTION_ERROR_LOG_GENERIC, error as Error);
    throw new Error(ERROR_MESSAGES.FAILED_TO_DECRYPT);
  }
}

// Backward-compatible aliases
export const encrypt = encryptCredential;
export const decrypt = decryptCredential;
