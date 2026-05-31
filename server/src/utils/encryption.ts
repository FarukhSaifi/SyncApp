import crypto from "crypto";

import { config } from "../config";
import { ERROR_MESSAGES } from "../constants/messages";
import { logger } from "./logger";

const PLACEHOLDER_KEY_PATTERN = /your_.*_(hex|string)_here/i;

function deriveKeyMaterial(raw: string, byteLength: number): Buffer {
  return Buffer.from(raw.padEnd(byteLength, "!").slice(0, byteLength), "utf8");
}

const key = deriveKeyMaterial(config.encryption.key || "", 32);
const iv = deriveKeyMaterial(config.encryption.iv || "", 16);

if (PLACEHOLDER_KEY_PATTERN.test(config.encryption.key) || PLACEHOLDER_KEY_PATTERN.test(config.encryption.iv)) {
  logger.warn(
    "ENCRYPTION_KEY / ENCRYPTION_IV look like placeholders. Publishing and stored credentials will fail until they match production.",
  );
}

/**
 * Encrypt a string using AES-256-CBC
 * @param text - The text to encrypt
 * @returns The encrypted text as a hex string
 */
export function encrypt(text: string): string {
  try {
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return encrypted;
  } catch (error) {
    logger.error(ERROR_MESSAGES.ENCRYPTION_ERROR_LOG, error as Error);
    throw new Error(ERROR_MESSAGES.FAILED_TO_ENCRYPT);
  }
}

/**
 * Decrypt a string using AES-256-CBC
 * @param encryptedText - The encrypted text as a hex string
 * @returns The decrypted text
 */
export function decrypt(encryptedText: string): string {
  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error(ERROR_MESSAGES.DECRYPTION_ERROR_LOG_GENERIC, error as Error);
    throw new Error(ERROR_MESSAGES.FAILED_TO_DECRYPT);
  }
}

/**
 * Generate a random encryption key (32 bytes)
 * @returns A random 32-character string
 */
export function generateKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a random IV (16 bytes)
 * @returns A random 16-character string
 */
export function generateIV(): string {
  return crypto.randomBytes(16).toString("hex");
}
