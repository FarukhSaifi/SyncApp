import crypto from 'crypto';
import { config } from '../config';
import { ERROR_MESSAGES } from '../constants/messages';
import { logger } from './logger';

// Ensure the key is exactly 32 bytes (256 bits) for AES-256
const key = Buffer.from((config.encryption.key || '').padEnd(32, '!').slice(0, 32), 'utf8');
// Ensure the IV is exactly 16 bytes (128 bits) for AES-256
const iv = Buffer.from((config.encryption.iv || '').padEnd(16, '!').slice(0, 16), 'utf8');

/**
 * Encrypt a string using AES-256-CBC
 * @param text - The text to encrypt
 * @returns The encrypted text as a hex string
 */
export function encrypt(text: string): string {
  try {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

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
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

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
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a random IV (16 bytes)
 * @returns A random 16-character string
 */
export function generateIV(): string {
  return crypto.randomBytes(16).toString('hex');
}
