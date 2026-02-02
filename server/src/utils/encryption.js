const crypto = require("crypto");
const { config } = require("../config");
const { logger } = require("./logger");

// Ensure the key is exactly 32 bytes (256 bits) for AES-256
const key = Buffer.from((config.encryption.key || "").padEnd(32, "!").slice(0, 32), "utf8");
// Ensure the IV is exactly 16 bytes (128 bits) for AES-256
const iv = Buffer.from((config.encryption.iv || "").padEnd(16, "!").slice(0, 16), "utf8");

/**
 * Encrypt a string using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text as a hex string
 */
function encrypt(text) {
  try {
    // Create cipher using AES-256-CBC
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return encrypted;
  } catch (error) {
    logger.error("Encryption error", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a string using AES-256-CBC
 * @param {string} encryptedText - The encrypted text as a hex string
 * @returns {string} - The decrypted text
 */
function decrypt(encryptedText) {
  try {
    // Create decipher using AES-256-CBC
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    // Decrypt the text
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("Decryption error", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Generate a random encryption key (32 bytes)
 * @returns {string} - A random 32-character string
 */
function generateKey() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a random IV (16 bytes)
 * @returns {string} - A random 16-character string
 */
function generateIV() {
  return crypto.randomBytes(16).toString("hex");
}

module.exports = {
  encrypt,
  decrypt,
  generateKey,
  generateIV,
};
