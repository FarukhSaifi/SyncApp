#!/usr/bin/env node

/**
 * Generate secure encryption keys for SyncApp
 * Run this script to generate new encryption keys
 */

const crypto = require("crypto");

console.log("🔐 SyncApp Encryption Key Generator");
console.log("=====================================\n");

// Generate a random 32-byte (256-bit) encryption key (64 hex characters)
const encryptionKey = crypto.randomBytes(32).toString("hex");

console.log("✅ Generated secure encryption key for AES-256-GCM:\n");

console.log("ENCRYPTION_KEY=" + encryptionKey);

console.log("\n📝 Add this to your .env file:");
console.log("--------------------------------");
console.log(`ENCRYPTION_KEY=${encryptionKey}`);

console.log("\n⚠️  Important Security Notes:");
console.log("- Keep these keys secret and secure");
console.log("- Never commit them to version control");
console.log("- Use different keys for production");
console.log("- Backup these keys securely");

console.log("\n🚀 Your SyncApp is now ready for secure credential storage!");
