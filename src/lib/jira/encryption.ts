import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const hex = process.env.JIRA_TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error("JIRA_TOKEN_ENCRYPTION_KEY environment variable is not set");
  }
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    throw new Error(
      `JIRA_TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex chars), got ${buf.length} bytes`
    );
  }
  return buf;
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns a string in the format `iv:ciphertext:tag` (all base64-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    encrypted.toString("base64"),
    tag.toString("base64"),
  ].join(":");
}

/**
 * Decrypts a string produced by `encrypt()`.
 * Expects the format `iv:ciphertext:tag` (all base64-encoded).
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid encrypted format: expected 3 base64 parts separated by ":", got ${parts.length}`
    );
  }

  const iv = Buffer.from(parts[0], "base64");
  const ciphertext = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
